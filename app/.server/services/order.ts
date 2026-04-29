import currency from "currency.js";
import dayjs from "dayjs";

import {
  insertOrder,
  updateOrder,
  getOrderBySessionId,
} from "~/.server/model/order";
import {
  insertSubscription,
  updateSubscription,
  getSubscriptionById,
  getSubscriptionByPlatformSubId,
} from "~/.server/model/subscriptions";

import {
  insertCreditRecord,
  updateCreditRecord,
  getCreditRecordBySourceId,
  getCreditRecordBySource,
} from "~/.server/model/credit_record";
import { insertCreditConsumption } from "~/.server/model/credit_consumptions";

import { createCreem } from "~/.server/libs/creem";
import type {
  Customer,
  Subscription as CreemSubscription,
} from "~/.server/libs/creem/types";
import type { User } from "~/.server/libs/db";

import { PRICING_TIERS } from "~/constants/product";

function generateUniqueOrderNo(prefix = "ORD") {
  const dateTimePart = dayjs().format("YYYYMMDDHHmmssSSS");
  const randomPart = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");

  return [prefix, dateTimePart, randomPart].join("");
}

interface CreateOrderOptions {
  type: "once" | "monthly" | "yearly"; // 订单类型，一次性购买、月订阅、年订阅
  product_id: string;
  product_name: string;
  price: number; // 支付金额，单位元
  credits?: number; // 订单购买的 Credits 数量（仅 once 订单）
  plan_id?: string; // 订阅计划的编码
}

type BillingInterval = "month" | "year";

const getBillingInterval = (
  typeOrInterval: CreateOrderOptions["type"] | BillingInterval
): BillingInterval => {
  return typeOrInterval === "yearly" || typeOrInterval === "year" ? "year" : "month";
};

const getSubscriptionTier = (planId?: string) => {
  if (!planId) return null;
  return PRICING_TIERS.find((item) => item.id === planId) || null;
};

const getCycleCredits = (planId: string, interval: BillingInterval) => {
  const tier = getSubscriptionTier(planId);
  if (!tier) return null;
  return interval === "year"
    ? tier.pricing.yearly.credits
    : tier.pricing.monthly.credits;
};

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.toDate() : null;
};

const resolveCycleExpiry = (
  interval: BillingInterval,
  subscription?: CreemSubscription
) => {
  const periodEnd = parseDate(subscription?.current_period_end_date);
  if (periodEnd) return periodEnd;

  return dayjs()
    .add(1, interval === "year" ? "year" : "month")
    .endOf("day")
    .toDate();
};

const resolvePaymentAt = (subscription?: CreemSubscription) => {
  return parseDate(subscription?.last_transaction_date) || new Date();
};

const resolveCycleSourceId = (
  subscription: CreemSubscription,
  eventId?: string
) => {
  if (subscription.last_transaction_id) {
    return `tx:${subscription.last_transaction_id}`;
  }

  if (subscription.current_period_start_date) {
    return `period:${subscription.id}:${subscription.current_period_start_date}`;
  }

  if (eventId) {
    return `event:${eventId}`;
  }

  return `subscription:${subscription.id}:${subscription.updated_at}`;
};

export const createOrder = async (payload: CreateOrderOptions, user: User, contextEnv?: any, origin?: string) => {
  const orderNo = generateUniqueOrderNo();

  const [order] = await insertOrder({
    order_no: orderNo,
    order_detail: payload,
    user_id: user.id,
    product_id: payload.product_id,
    product_name: payload.product_name,
    amount: currency(payload.price).intValue,
    status: "pending",
  });

  const creem = createCreem(contextEnv);
  const session = await creem.createCheckout({
    product_id: order.product_id,
    customer: { email: user.email },
    success_url: new URL(
      "/callback/payment",
      origin || (import.meta.env.PROD ? contextEnv?.DOMAIN || "https://nanobanana.com" : "http://localhost:5173")
    ).toString(),
  });

  await updateOrder(order.id, {
    pay_session_id: session.id,
    pay_provider: "creem",
    session_detail: session,
  });

  return session;
};

export const handleOrderComplete = async (checkoutId: string) => {
  const creem = createCreem();
  const checkout = await creem.getCheckout(checkoutId);

  if (!checkout || checkout.status !== "completed") {
    throw Error("Invalid checkout");
  }

  const order = await getOrderBySessionId(checkout.id);
  if (!order) throw Error("Invalid transaction");
  if (order.status !== "pending") {
    throw Error(`Transaction is ${order.status}`);
  }
  const customer = checkout.customer as Customer;
  await updateOrder(order.id, {
    paid_at: new Date(),
    paid_email: customer.email,
    paid_detail: checkout,
    status: "processing",
  });

  const orderDetail = order.order_detail as CreateOrderOptions;
  const { type, credits, plan_id } = orderDetail;

  if (type === "once") {
    if (credits) {
      await insertCreditRecord({
        user_id: order.user_id,
        credits: credits,
        remaining_credits: credits,
        trans_type: "purchase",
        source_type: "order",
        source_id: order.order_no,
      });
    }

    const [result] = await updateOrder(order.id, {
      status: "completed",
    });

    return result;
  } else {
    const plan = getSubscriptionTier(plan_id);
    const hasError = !plan;

    if (hasError) {
      const [result] = await updateOrder(order.id, {
        status: "completed",
        is_error: true,
        error_msg: "Unvalid Subscription Plan",
      });

      return result;
    } else {
      const interval = getBillingInterval(orderDetail.type);
      const subscription = checkout.subscription as CreemSubscription | string;
      if (typeof subscription === "string") {
        throw Error("Missing subscription details");
      }
      const expiredAt = resolveCycleExpiry(interval, subscription);
      const paidAt = resolvePaymentAt(subscription);
      const [sub] = await insertSubscription({
        user_id: order.user_id,
        plan_type: plan.id,
        status: "active",
        interval,
        interval_count: 1,
        platform_sub_id: subscription.id,
        start_at: dayjs().startOf("day").toDate(),
        expired_at: expiredAt,
        last_payment_at: paidAt,
      });

      // 订阅积分按计费周期发放，首购时发放当前周期积分。
      const creditsToGive = credits || getCycleCredits(plan.id, interval);
      if (creditsToGive) {
        await insertCreditRecord({
          user_id: order.user_id,
          credits: creditsToGive,
          remaining_credits: creditsToGive,
          trans_type: "subscription",
          source_type: "subscription_cycle",
          source_id: resolveCycleSourceId(subscription),
          expired_at: expiredAt,
          note: `${plan.name} ${interval === "year" ? "yearly" : "monthly"} billing cycle credits`,
        });
      }

      const [result] = await updateOrder(order.id, {
        status: "completed",
        sub_id: subscription.id,
        subscription_id: sub.id,
      });

      return result;
    }
  }
};

export const handleOrderRefund = async (checkoutId: string) => {
  const creem = createCreem();
  const checkout = await creem.getCheckout(checkoutId);
  if (!checkout || checkout.status !== "completed") {
    throw Error("Invalid checkout");
  }

  const order = await getOrderBySessionId(checkout.id);

  if (!order) throw Error("Invalid transaction");
  if (order.status !== "completed") {
    throw Error(`Transaction is ${order.status}`);
  }

  if (order.subscription_id) {
    const subscription = await getSubscriptionById(order.subscription_id);
    if (subscription) {
      await updateSubscription(subscription.id, {
        status: "cancelled",
        expired_at: new Date(),
        cancel_at: new Date(),
      });
    }
  }

  let credit = await getCreditRecordBySourceId(order.order_no);
  if (!credit && order.sub_id) {
    const checkoutSubscription = checkout.subscription as CreemSubscription | string;
    if (typeof checkoutSubscription !== "string") {
      const cycleSourceId = resolveCycleSourceId(checkoutSubscription);
      credit = await getCreditRecordBySource("subscription_cycle", cycleSourceId);
    }
  }

  if (credit && credit.remaining_credits > 0) {
    await updateCreditRecord(credit.id, { remaining_credits: 0 });
    await insertCreditConsumption({
      user_id: credit.user_id,
      credits: credit.remaining_credits,
      credit_record_id: credit.id,
      reason: "Order Refund",
    });
  }

  const [result] = await updateOrder(order.id, {
    status: "refunded",
  });

  return result;
};

export const handleSubscriptionPaid = async (
  subscription: CreemSubscription,
  eventId?: string
) => {
  const localSubscription = await getSubscriptionByPlatformSubId(subscription.id);
  if (!localSubscription) {
    throw Error("Invalid subscription");
  }

  const sourceId = resolveCycleSourceId(subscription, eventId);
  const existingCredit = await getCreditRecordBySource("subscription_cycle", sourceId);
  if (existingCredit) {
    return {
      subscription: localSubscription,
      credited: false,
      creditRecordId: existingCredit.id,
    };
  }

  const interval = getBillingInterval(localSubscription.interval || "month");
  const creditsToGive = getCycleCredits(localSubscription.plan_type, interval);
  if (!creditsToGive) {
    throw Error("Invalid subscription plan");
  }

  const expiredAt = resolveCycleExpiry(interval, subscription);
  const paidAt = resolvePaymentAt(subscription);

  await updateSubscription(localSubscription.id, {
    status: "active",
    last_payment_at: paidAt,
    expired_at: expiredAt,
    cancel_at: null,
  });

  const [creditRecord] = await insertCreditRecord({
    user_id: localSubscription.user_id,
    credits: creditsToGive,
    remaining_credits: creditsToGive,
    trans_type: "subscription",
    source_type: "subscription_cycle",
    source_id: sourceId,
    expired_at: expiredAt,
    note: `${localSubscription.plan_type} ${interval === "year" ? "yearly" : "monthly"} billing cycle credits`,
  });

  return {
    subscription: localSubscription,
    credited: true,
    creditRecordId: creditRecord.id,
  };
};

export const handleSubscriptionStatusChange = async (
  subscription: CreemSubscription,
  status: "cancelled" | "expired"
) => {
  const localSubscription = await getSubscriptionByPlatformSubId(subscription.id);
  if (!localSubscription) {
    throw Error("Invalid subscription");
  }

  const expiredAt =
    parseDate(subscription.current_period_end_date) ||
    parseDate(subscription.canceled_at) ||
    new Date();

  const value = {
    status,
    expired_at: expiredAt,
    cancel_at: status === "cancelled" ? parseDate(subscription.canceled_at) || new Date() : localSubscription.cancel_at,
  } as const;

  const [updated] = await updateSubscription(localSubscription.id, value);
  return updated;
};
