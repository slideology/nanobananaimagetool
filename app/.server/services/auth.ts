import { env } from "cloudflare:workers";
import {
  getUserAuthByProvider,
  insertUserAuth,
} from "~/.server/model/user_auth";
import { getUserByEmail, insertUser, updateUser } from "~/.server/model/user";
import { insertSigninLog } from "~/.server/model/signin_log";
import type { User, InsertUser, InsertUserAuth } from "~/.server/libs/db";
import { connectDB, schema } from "~/.server/libs/db";
import { eq } from "drizzle-orm";

import { insertCreditRecord } from "~/.server/model/credit_record";

/**
 * 创建新用户并分配初始积分
 * @param newUser 新用户信息
 * @param hasUsedGuestCredit 是否已使用过临时积分
 */
export const createUser = async (newUser: InsertUser, hasUsedGuestCredit: boolean = false) => {
  // 🔒 安全修复：新用户创建时就标记已获得登录奖励，防止重复获得
  const userWithBonusFlag = {
    ...newUser,
    has_received_login_bonus: 1, // 新用户创建时就标记已获得奖励
  };

  const [createdUser] = await insertUser(userWithBonusFlag);

  if (env.INITLIZE_CREDITS) {
    // 智能积分分配逻辑：
    // - 如果用户已使用过临时积分，给30积分（登录奖励）
    // - 如果用户未使用过临时积分，给60积分（初始积分 + 登录奖励）
    const creditsToGive = hasUsedGuestCredit ? 30 : 60;
    const note = hasUsedGuestCredit
      ? "登录奖励积分"
      : "新用户初始积分 + 登录奖励积分";

    await insertCreditRecord({
      user_id: createdUser.id,
      credits: creditsToGive,
      remaining_credits: creditsToGive,
      trans_type: "initilize",
      note: note,
    });
  }

  return createdUser;
};
/**
 * Google OAuth 登录流程
 * @param profile 从 Google OAuth 获取的用户资料
 * @param hasUsedGuestCredit 是否已使用过临时积分
 */
export const googleOAuthLogin = async (params: {
  profile: GoogleUserInfo;
  request: Request;
  session: string;
  hasUsedGuestCredit?: boolean;
}) => {
  const { session, profile, request, hasUsedGuestCredit = false } = params;

  const provider = "google";
  const { sub: openid, email, name, picture: avatar } = profile;

  // 1. 查询是否有同 email 的用户，有则赋值，无则 insert
  let user: User | null = null;
  const result = await getUserByEmail(email);
  if (!result) {
    const newUser: InsertUser = {
      email,
      nickname: name,
      avatar_url: avatar,
    };
    user = await createUser(newUser, hasUsedGuestCredit);
  } else {
    user = result;

    // 🔒 并发安全：使用事务确保登录奖励的原子性，防止重复奖励
    if (user && !user.has_received_login_bonus && !hasUsedGuestCredit && env.INITLIZE_CREDITS) {
      const db = connectDB();
      const userId = user.id;
      const userEmail = user.email;

      try {
        await db.transaction(async (tx) => {
          // 在事务中再次检查用户状态，防止竞态条件
          const latestUser = await tx.query.users.findFirst({
            where: eq(schema.users.id, userId),
          });

          if (latestUser && !latestUser.has_received_login_bonus) {
            // 插入积分记录
            await tx.insert(schema.credit_records).values({
              user_id: userId,
              credits: 30,
              remaining_credits: 30,
              trans_type: "initilize",
              note: "登录奖励积分",
            });

            // 标记用户已获得登录奖励
            await tx.update(schema.users)
              .set({
                has_received_login_bonus: 1,
                updated_at: new Date()
              })
              .where(eq(schema.users.id, userId));

            console.log(`✅ 用户 ${userEmail} 获得登录奖励积分`);
          } else {
            console.log(`ℹ️ 用户 ${userEmail} 已获得过登录奖励，跳过`);
          }
        });
      } catch (error) {
        console.error("登录奖励事务失败:", error);
        // 事务失败不影响登录流程，只是不给奖励积分
      }
    }
  }

  // 2. 查询该 provider 是否进行了绑定，未绑定则写记录关联
  const userAuth = await getUserAuthByProvider(provider, openid);
  if (!userAuth) {
    const newAuth: InsertUserAuth = {
      user_id: user.id,
      provider,
      openid,
    };
    await insertUserAuth(newAuth);
  }

  // 3. 记录登录日志
  const ip = request.headers.get("x-real-ip");
  const ua = request.headers.get("user-agent");
  const headers = Object.fromEntries(request.headers.entries());
  await insertSigninLog({
    session: session,
    user_id: user.id,
    type: provider,
    ip,
    user_agent: ua,
    headers,
  });

  return user;
};
