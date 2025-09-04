import type { Route } from "./+types/route";
import { data } from "react-router";

import { getSessionHandler } from "~/.server/libs/session";
import { createOrder } from "~/.server/services/order";
import { ErrorHandler } from "~/.server/utils/error-handler";
import { BaseError, UserNotAuthenticatedError, RequiredParameterMissingError } from "~/.server/types/errors";

import { PRODUCTS_LIST } from "~/.server/constants";

export async function action({ request }: Route.ActionArgs) {
  try {
    const raw = await request.json<{ product_id: string }>();
    const { product_id } = raw;
    
    if (!product_id) {
      const paramError = new RequiredParameterMissingError("product_id");
      return ErrorHandler.createErrorResponse(paramError);
    }
    
    const product = PRODUCTS_LIST.find((item) => item.product_id === product_id);
    if (!product) {
      const paramError = new RequiredParameterMissingError("product_id", { 
        message: "产品不存在",
        availableProducts: PRODUCTS_LIST.map(p => p.product_id)
      });
      return ErrorHandler.createErrorResponse(paramError);
    }

    const [session] = await getSessionHandler(request);
    const user = session.get("user");
    if (!user) {
      const authError = new UserNotAuthenticatedError();
      return ErrorHandler.createErrorResponse(authError);
    }

    const result = await createOrder(
      {
        credits: product.credits,
        price: product.price,
        product_id: product.product_id,
        product_name: product.product_name,
        type: product.type,
      },
      user
    );

    return data(result);
  } catch (error) {
    console.error("Create order error:", error);
    
    if (error instanceof BaseError) {
      return ErrorHandler.createErrorResponse(error);
    }
    
    const systemError = new RequiredParameterMissingError(
      "SYSTEM_ERROR",
      { originalError: error instanceof Error ? error.message : "Unknown error" }
    );
    return ErrorHandler.createErrorResponse(systemError);
  }
}
