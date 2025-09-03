import type { Route } from "./+types/route";
import { data } from "react-router";

import { updateTaskStatus } from "~/.server/services/ai-tasks";

export const loader = async ({ params, context }: Route.LoaderArgs) => {
  const taskNo = params.task_no;
  const result = await updateTaskStatus(context.cloudflare.env, taskNo);

  return data(result);
};
export type TaskResult = Awaited<ReturnType<typeof loader>>["data"];
