/**
 * 性能优化工具模块
 * 
 * 提供文件上传优化、请求缓存、连接池等性能改进功能
 */

// 文件上传优化配置
export const FILE_UPLOAD_CONFIG = {
  // 最大文件大小 (10MB)
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  // 支持的文件类型
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  // 分块上传阈值 (5MB)
  CHUNK_THRESHOLD: 5 * 1024 * 1024,
  // 分块大小 (1MB)
  CHUNK_SIZE: 1024 * 1024,
  // 并发上传数
  MAX_CONCURRENT_UPLOADS: 3
} as const;

// 请求缓存配置
export const CACHE_CONFIG = {
  // 任务状态查询缓存时间 (30秒)
  TASK_STATUS_TTL: 30 * 1000,
  // API响应缓存时间 (5分钟)
  API_RESPONSE_TTL: 5 * 60 * 1000,
  // 图片预览缓存时间 (1小时)
  IMAGE_PREVIEW_TTL: 60 * 60 * 1000
} as const;

/**
 * 内存缓存实现
 */
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number }>();

  set(key: string, value: any, ttl: number): void {
    const expires = Date.now() + ttl;
    this.cache.set(key, { data: value, expires });
  }

  get<T>(key: string): T | null {
    conditionalCleanup(); // 在访问时进行条件清理
    
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

// 全局缓存实例
export const cache = new MemoryCache();

// 在 Cloudflare Workers 中，不能在全局作用域使用 setInterval
// 改为在访问缓存时进行清理
let lastCleanup = 0;
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5分钟

function conditionalCleanup() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    cache.cleanup();
    lastCleanup = now;
  }
}

/**
 * 文件压缩和优化
 */
export class FileOptimizer {
  /**
   * 检查文件是否需要压缩
   */
  static shouldCompress(file: File): boolean {
    return file.size > FILE_UPLOAD_CONFIG.CHUNK_THRESHOLD;
  }

  /**
   * 压缩图片文件
   */
  static async compressImage(file: File, quality = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 计算压缩后的尺寸
        const maxWidth = 2048;
        const maxHeight = 2048;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // 绘制并压缩
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file); // 压缩失败，返回原文件
          }
        }, file.type, quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * 生成文件缩略图
   */
  static async generateThumbnail(file: File, maxSize = 200): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const { width, height } = img;
        const ratio = Math.min(maxSize / width, maxSize / height);
        
        canvas.width = width * ratio;
        canvas.height = height * ratio;

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

/**
 * 分块上传管理器
 */
export class ChunkUploader {
  private chunks: Blob[] = [];
  private uploadPromises: Promise<Response>[] = [];

  constructor(private file: File, private uploadUrl: string) {}

  /**
   * 将文件分块
   */
  private createChunks(): void {
    const chunkSize = FILE_UPLOAD_CONFIG.CHUNK_SIZE;
    const totalChunks = Math.ceil(this.file.size / chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, this.file.size);
      this.chunks.push(this.file.slice(start, end));
    }
  }

  /**
   * 上传单个分块
   */
  private async uploadChunk(chunk: Blob, index: number): Promise<Response> {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', index.toString());
    formData.append('totalChunks', this.chunks.length.toString());
    formData.append('fileName', this.file.name);

    return fetch(`${this.uploadUrl}/chunk`, {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * 执行分块上传
   */
  async upload(
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
    try {
      this.createChunks();
      let completedChunks = 0;

      // 并发上传分块，但限制并发数
      const maxConcurrent = FILE_UPLOAD_CONFIG.MAX_CONCURRENT_UPLOADS;
      const results: Response[] = [];

      for (let i = 0; i < this.chunks.length; i += maxConcurrent) {
        const batch = this.chunks.slice(i, i + maxConcurrent);
        const batchPromises = batch.map((chunk, batchIndex) =>
          this.uploadChunk(chunk, i + batchIndex)
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        completedChunks += batch.length;
        onProgress?.(completedChunks / this.chunks.length);
      }

      // 检查所有分块是否上传成功
      const allSuccessful = results.every(res => res.ok);
      if (!allSuccessful) {
        throw new Error('Some chunks failed to upload');
      }

      // 合并分块
      const mergeResponse = await fetch(`${this.uploadUrl}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: this.file.name,
          totalChunks: this.chunks.length,
        }),
      });

      if (!mergeResponse.ok) {
        throw new Error('Failed to merge chunks');
      }

      const { fileUrl } = await mergeResponse.json() as { fileUrl: string };
      return { success: true, fileUrl };

    } catch (error) {
      console.error('Chunk upload failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }
}

/**
 * 请求去重和缓存装饰器
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  ttl: number,
  keyGenerator?: (...args: Parameters<T>) => string
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;

    descriptor.value = async function (this: any, ...args: Parameters<T>) {
      const key = keyGenerator 
        ? keyGenerator(...args)
        : `${propertyName}_${JSON.stringify(args)}`;

      // 检查缓存
      const cachedResult = cache.get<Awaited<ReturnType<T>>>(key);
      if (cachedResult !== null) {
        return cachedResult;
      }

      // 执行原方法并缓存结果
      const result = await method.apply(this, args);
      cache.set(key, result, ttl);
      
      return result;
    } as T;
  };
}

/**
 * 请求防抖和节流
 */
export class RequestThrottle {
  private static pendingRequests = new Map<string, Promise<any>>();

  /**
   * 防止重复请求
   */
  static async dedupe<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // 如果已有相同请求在进行中，返回该请求的Promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // 创建新请求
    const promise = requestFn().finally(() => {
      // 请求完成后清理
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * 节流函数
   */
  static throttle<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): T {
    let lastCall = 0;
    let timeoutId: NodeJS.Timeout | null = null;

    return ((...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastCall >= delay) {
        lastCall = now;
        return fn(...args);
      } else {
        if (timeoutId) clearTimeout(timeoutId);
        
        timeoutId = setTimeout(() => {
          lastCall = Date.now();
          fn(...args);
        }, delay - (now - lastCall));
      }
    }) as T;
  }

  /**
   * 防抖函数
   */
  static debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): T {
    let timeoutId: NodeJS.Timeout | null = null;

    return ((...args: Parameters<T>) => {
      if (timeoutId) clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        fn(...args);
      }, delay);
    }) as T;
  }
}

/**
 * 连接池管理器 (模拟)
 */
export class ConnectionPool {
  private static maxConnections = 10;
  private static activeConnections = 0;
  private static waitingQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
    fn: () => Promise<any>;
  }> = [];

  /**
   * 获取连接并执行请求
   */
  static async acquire<T>(fn: () => Promise<T>): Promise<T> {
    if (this.activeConnections < this.maxConnections) {
      this.activeConnections++;
      try {
        return await fn();
      } finally {
        this.activeConnections--;
        this.processQueue();
      }
    } else {
      // 等待可用连接
      return new Promise<T>((resolve, reject) => {
        this.waitingQueue.push({ resolve, reject, fn });
      });
    }
  }

  private static async processQueue(): Promise<void> {
    if (this.waitingQueue.length > 0 && this.activeConnections < this.maxConnections) {
      const { resolve, reject, fn } = this.waitingQueue.shift()!;
      
      this.activeConnections++;
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        this.activeConnections--;
        this.processQueue();
      }
    }
  }
}

/**
 * 性能监控工具
 */
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  /**
   * 记录执行时间
   */
  static time<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      const result = fn();
      
      // 如果是Promise，等待完成后记录时间
      if (result instanceof Promise) {
        result.finally(() => {
          const duration = performance.now() - start;
          this.recordMetric(name, duration);
        });
      } else {
        const duration = performance.now() - start;
        this.recordMetric(name, duration);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name}_error`, duration);
      throw error;
    }
  }

  private static recordMetric(name: string, duration: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const measurements = this.metrics.get(name)!;
    measurements.push(duration);
    
    // 保持最近100个测量值
    if (measurements.length > 100) {
      measurements.shift();
    }
  }

  /**
   * 获取性能统计
   */
  static getStats(name: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
  } | null {
    const measurements = this.metrics.get(name);
    if (!measurements || measurements.length === 0) return null;

    const count = measurements.length;
    const avg = measurements.reduce((sum, val) => sum + val, 0) / count;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);

    return { count, avg, min, max };
  }

  /**
   * 获取所有性能指标
   */
  static getAllStats(): Record<string, ReturnType<typeof PerformanceMonitor.getStats>> {
    const stats: Record<string, any> = {};
    for (const [name] of this.metrics) {
      stats[name] = this.getStats(name);
    }
    return stats;
  }
}