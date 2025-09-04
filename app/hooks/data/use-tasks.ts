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
    if (allCompleted) return; // 🔧 如果已完成，不要启动轮询

    // 🔧 添加最大轮询限制
    const MAX_POLL_COUNT = 150; // 5分钟 (2秒 x 150)
    const MAX_POLL_TIME = 10 * 60 * 1000; // 10分钟

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

    let currentPollCount = 0;
    
    const updateAllTasks = async () => {
      currentPollCount++;
      setPollCount(currentPollCount);
      const elapsedTime = startTime ? Date.now() - startTime : 0;

      // 🔧 检查是否超过最大轮询限制
      if (currentPollCount > MAX_POLL_COUNT || elapsedTime > MAX_POLL_TIME) {
        console.warn("⚠️ 轮询超时，停止轮询", { 
          pollCount: currentPollCount, 
          elapsedTime,
          tasks: tasks.map(t => String(t[taskKey]))
        });
        
        tasks.forEach((task) => {
          FrontendLogger.logPollingTimeout({
            taskId: String(task[taskKey]),
            pollCount: currentPollCount,
            elapsedTime
          });
        });
        
        clearInterval(interval);
        return;
      }

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
          } catch (error) {
            console.warn(`轮询任务更新失败:`, String(task[taskKey]), error);
            return task;
          }
        })
      );

      // 🔧 检查是否所有任务都完成
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

    return () => {
      clearInterval(interval);
    };
  }, [taskKeyString, startTime]); // 🔧 移除pollCount依赖

  return [tasks, setTasks, { allDone: allCompleted }] as const;
}
