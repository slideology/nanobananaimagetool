import type { Route } from "./+types/route";
import { data } from "react-router";

import { createAiImageSchema } from "~/.server/schema/task";
import { getSessionHandler } from "~/.server/libs/session";

import { createAiImage } from "~/.server/services/ai-tasks";

export const action = async ({ request, context }: Route.ActionArgs) => {
  if (request.method.toLowerCase() !== "post") {
    throw new Response("Not Found", { status: 404 });
  }

  const form = await request.formData();
  const raw = Object.fromEntries(form.entries());
  const json = createAiImageSchema.parse(raw);

  const [session] = await getSessionHandler(request);
  const user = session.get("user");
  if (!user) throw new Response("Unauthorized", { status: 401 });

  try {
    const result = await createAiImage(context.cloudflare.env, json, user);
    return data(result);
  } catch (e) {
    console.error("Create ai image error:");
    console.error("Error details:", {
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
      type: typeof e,
      json: json,
      user: { id: user.id, email: user.email }
    });
    
    // 返回更详细的错误信息
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    throw new Response(`Server Error: ${errorMessage}`, { status: 500 });
  }
};

export type AiImageResult = Awaited<ReturnType<typeof action>>["data"];