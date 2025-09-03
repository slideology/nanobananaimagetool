/**
 * 优化的文件上传服务
 * 
 * 集成了压缩、缓存、分块上传等性能优化功能
 */

import { env } from "cloudflare:workers";
import { 
  FileOptimizer, 
  ChunkUploader, 
  ConnectionPool, 
  PerformanceMonitor,
  FILE_UPLOAD_CONFIG 
} from "../utils/performance";

export interface UploadOptions {
  folder?: string;
  compress?: boolean;
  generateThumbnail?: boolean;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  success: boolean;
  fileUrl?: string;
  thumbnailUrl?: string;
  originalSize?: number;
  compressedSize?: number;
  error?: string;
}

/**
 * 优化的文件上传服务
 */
export class OptimizedFileUploadService {
  /**
   * 验证文件
   */
  private static validateFile(file: File): { valid: boolean; error?: string } {
    // 检查文件大小
    if (file.size > FILE_UPLOAD_CONFIG.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `文件大小超过限制: ${Math.round(file.size / 1024 / 1024)}MB > 10MB`
      };
    }

    // 检查文件类型
    if (!FILE_UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.type as any)) {
      return {
        valid: false,
        error: `不支持的文件格式: ${file.type}`
      };
    }

    return { valid: true };
  }

  /**
   * 上传单个文件 (优化版)
   */
  static async uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
    return PerformanceMonitor.time('file_upload', async () => {
      try {
        // 验证文件
        const validation = this.validateFile(file);
        if (!validation.valid) {
          return {
            success: false,
            error: validation.error
          };
        }

        const originalSize = file.size;
        let processedFile = file;
        let thumbnailUrl: string | undefined;

        // 生成缩略图
        if (options.generateThumbnail && typeof document !== 'undefined') {
          try {
            thumbnailUrl = await FileOptimizer.generateThumbnail(file);
          } catch (error) {
            console.warn('Failed to generate thumbnail:', error);
          }
        }

        // 压缩文件 (如果需要且在浏览器环境)
        if (options.compress && typeof document !== 'undefined' && FileOptimizer.shouldCompress(file)) {
          try {
            processedFile = await FileOptimizer.compressImage(file, 0.8);
            console.log(`File compressed from ${originalSize} to ${processedFile.size} bytes`);
          } catch (error) {
            console.warn('File compression failed, using original:', error);
          }
        }

        let fileUrl: string;

        // 选择上传方式：大文件使用分块上传
        if (processedFile.size > FILE_UPLOAD_CONFIG.CHUNK_THRESHOLD) {
          const uploader = new ChunkUploader(processedFile, '/api/upload');
          const result = await uploader.upload(options.onProgress);
          
          if (!result.success) {
            return {
              success: false,
              error: result.error
            };
          }
          
          fileUrl = result.fileUrl!;
        } else {
          // 小文件直接上传
          fileUrl = await this.directUpload(processedFile, options.folder || 'cache', options.onProgress);
        }

        return {
          success: true,
          fileUrl,
          thumbnailUrl,
          originalSize,
          compressedSize: processedFile.size,
        };

      } catch (error) {
        console.error('File upload failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed'
        };
      }
    });
  }

  /**
   * 直接上传文件到R2
   */
  private static async directUpload(
    file: File, 
    folder: string, 
    onProgress?: (progress: number) => void
  ): Promise<string> {
    return ConnectionPool.acquire(async () => {
      const path = `${folder}/${Date.now()}-${file.name}`;
      
      // 模拟上传进度
      onProgress?.(0.5);
      
      const result = await env.R2.put(path, file);
      
      if (!result) {
        throw new Error('Failed to upload to R2');
      }
      
      onProgress?.(1.0);
      
      // 返回文件URL (需要根据实际CDN配置调整)
      return `${env.CDN_URL}/${path}`;
    });
  }

  /**
   * 批量上传文件
   */
  static async uploadFiles(
    files: File[], 
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    return PerformanceMonitor.time('batch_upload', async () => {
      const maxConcurrent = FILE_UPLOAD_CONFIG.MAX_CONCURRENT_UPLOADS;
      const results: UploadResult[] = [];

      // 分批并发上传
      for (let i = 0; i < files.length; i += maxConcurrent) {
        const batch = files.slice(i, i + maxConcurrent);
        const batchPromises = batch.map((file, batchIndex) => {
          const fileOptions = {
            ...options,
            onProgress: options.onProgress 
              ? (progress: number) => {
                  const totalProgress = (i + batchIndex + progress) / files.length;
                  options.onProgress!(totalProgress);
                }
              : undefined
          };
          return this.uploadFile(file, fileOptions);
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      return results;
    });
  }

  /**
   * 预处理文件 (压缩、验证等)
   */
  static async preprocessFile(file: File): Promise<{
    processedFile: File;
    thumbnail?: string;
    metadata: {
      originalSize: number;
      compressedSize: number;
      compressionRatio: number;
    };
  }> {
    return PerformanceMonitor.time('file_preprocessing', async () => {
      const originalSize = file.size;
      let processedFile = file;
      let thumbnail: string | undefined;

      // 生成缩略图
      if (typeof document !== 'undefined') {
        try {
          thumbnail = await FileOptimizer.generateThumbnail(file);
        } catch (error) {
          console.warn('Thumbnail generation failed:', error);
        }
      }

      // 压缩文件
      if (typeof document !== 'undefined' && FileOptimizer.shouldCompress(file)) {
        try {
          processedFile = await FileOptimizer.compressImage(file, 0.8);
        } catch (error) {
          console.warn('File compression failed:', error);
        }
      }

      const compressedSize = processedFile.size;
      const compressionRatio = originalSize > 0 ? (originalSize - compressedSize) / originalSize : 0;

      return {
        processedFile,
        thumbnail,
        metadata: {
          originalSize,
          compressedSize,
          compressionRatio: Math.round(compressionRatio * 100) / 100
        }
      };
    });
  }
}

/**
 * 上传进度管理器
 */
export class UploadProgressManager {
  private uploads = new Map<string, {
    total: number;
    loaded: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
  }>();

  private listeners = new Set<(progress: Map<string, any>) => void>();

  /**
   * 开始上传
   */
  startUpload(id: string, totalSize: number): void {
    this.uploads.set(id, {
      total: totalSize,
      loaded: 0,
      status: 'uploading'
    });
    this.notifyListeners();
  }

  /**
   * 更新上传进度
   */
  updateProgress(id: string, loaded: number): void {
    const upload = this.uploads.get(id);
    if (upload) {
      upload.loaded = loaded;
      this.notifyListeners();
    }
  }

  /**
   * 完成上传
   */
  completeUpload(id: string): void {
    const upload = this.uploads.get(id);
    if (upload) {
      upload.status = 'completed';
      upload.loaded = upload.total;
      this.notifyListeners();
    }
  }

  /**
   * 上传失败
   */
  failUpload(id: string, error: string): void {
    const upload = this.uploads.get(id);
    if (upload) {
      upload.status = 'error';
      upload.error = error;
      this.notifyListeners();
    }
  }

  /**
   * 获取上传状态
   */
  getUploadStatus(id: string) {
    conditionalUploadCleanup(); // 在访问时进行条件清理
    return this.uploads.get(id);
  }

  /**
   * 获取所有上传状态
   */
  getAllUploads() {
    return new Map(this.uploads);
  }

  /**
   * 添加进度监听器
   */
  addProgressListener(listener: (progress: Map<string, any>) => void): void {
    this.listeners.add(listener);
  }

  /**
   * 移除进度监听器
   */
  removeProgressListener(listener: (progress: Map<string, any>) => void): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.getAllUploads());
    }
  }

  /**
   * 清理完成的上传记录
   */
  cleanup(): void {
    for (const [id, upload] of this.uploads.entries()) {
      if (upload.status === 'completed' || upload.status === 'error') {
        this.uploads.delete(id);
      }
    }
    this.notifyListeners();
  }
}

// 全局上传管理器实例
export const uploadManager = new UploadProgressManager();

// 在 Cloudflare Workers 中，不能在全局作用域使用 setInterval
// 改为在访问管理器时进行条件清理
let lastUploadCleanup = 0;
const UPLOAD_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5分钟

function conditionalUploadCleanup() {
  const now = Date.now();
  if (now - lastUploadCleanup > UPLOAD_CLEANUP_INTERVAL) {
    uploadManager.cleanup();
    lastUploadCleanup = now;
  }
}