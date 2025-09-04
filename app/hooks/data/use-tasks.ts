import { useEffect, useMemo, useState } from "react";
import { FrontendLogger } from "~/utils/frontend-logger";

type UseTasksOptions<T> = {
  onUpdateTask: (task: T) => Promise<T>;
  taskKey: keyof T;
  verifySuccess: (task: T) => boolean;
  intervalMs?: number;
  immediate?: boolean;
};

export function useTasks<T>({
  onUpdateTask,
  taskKey,
  verifySuccess,
  intervalMs = 2000,
  immediate = false,
}: UseTasksOptions<T>) {
  const [tasks, setTasks] = useState<T[]>([]);
  const [pollCount, setPollCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  const taskKeyString = useMemo(() => {
    return tasks
      .map((t) => String(t[taskKey]))
      .sort()
      .join("|");
  }, [tasks, taskKey]);

  const allCompleted = useMemo(() => {
    return tasks.every(verifySuccess);
  }, [tasks]);

  useEffect(() => {
    if (tasks.length === 0) return;

    // 记录轮询开始
    if (startTime === null) {
      const now = Date.now();
      setStartTime(now);
      setPollCount(0);
      
      // 为每个任务记录轮询开始
      tasks.forEach((task) => {
        FrontendLogger.logPollingStart({
          taskId: String(task[taskKey]),
          pollInterval: intervalMs
        });
      });
    }

    const updateAllTasks = async () => {
      const currentPollCount = pollCount + 1;
      setPollCount(currentPollCount);
      const elapsedTime = startTime ? Date.now() - startTime : 0;

      const updatedTasks = await Promise.all(
        tasks.map(async (task, idx) => {
          if (verifySuccess(task)) return task;

          try {
            const updated = await onUpdateTask(task);
            
            // 记录轮询更新
            FrontendLogger.logPollingUpdate({
              taskId: String(task[taskKey]),
              status: (updated as any).status || 'unknown',
              progress: (updated as any).progress,
              pollCount: currentPollCount,
              elapsedTime
            });
            
            setTasks((prev) => {
              const copy = [...prev];
              copy[idx] = updated;
              return copy;
            });
            return updated;
          } catch {
            return task;
          }
        })
      );

      if (updatedTasks.every(verifySuccess)) {
        // 记录轮询完成
        updatedTasks.forEach((task) => {
          FrontendLogger.logPollingComplete({
            taskId: String(task[taskKey]),
            finalStatus: (task as any).status || 'unknown',
            totalPollCount: currentPollCount,
            totalTime: elapsedTime,
            success: (task as any).status === 'succeeded',
            resultUrl: (task as any).result_url
          });
        });
        
        clearInterval(interval);
      }
    };

    if (immediate) {
      updateAllTasks();
    }

    const interval = setInterval(() => {
      updateAllTasks();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [taskKeyString, pollCount, startTime]);

  return [tasks, setTasks, { allDone: allCompleted }] as const;
}
