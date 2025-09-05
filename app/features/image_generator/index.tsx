import clsx from "clsx";
import {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useCallback,
} from "react";
import { useUser } from "~/store";
import { useTasks } from "~/hooks/data";
import { useErrorHandler, useFileValidation, usePromptValidation } from "~/hooks/use-error-handler";

import { GoogleOAuth, type GoogleOAuthBtnRef } from "~/features/oauth";
import { X, ImageIcon, Type, Wand2 } from "lucide-react";
import { Image } from "~/components/common";

import type { AiImageResult } from "~/routes/_api/create.ai-image/route";
import type { TaskResult } from "~/routes/_api/task.$task_no/route";
import { FrontendLogger } from "~/utils/frontend-logger";

export interface ImageStyle {
  name: string;
  value: string;
  cover: string;
  type: string;
  description: string;
}

export interface PromptCategory {
  name: string;
  value: string;
  prompts: string[];
}

export interface ImageGeneratorRef {
  open: (file?: File) => void;
  close: () => void;
}

export interface GenerationMode {
  id: "image-to-image" | "text-to-image";
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface ImageGeneratorProps {
  styles: ImageStyle[];
  promptCategories: PromptCategory[];
  inline?: boolean;
}

export const ImageGenerator = forwardRef<ImageGeneratorRef, ImageGeneratorProps>(
  ({ styles, promptCategories, inline = false }, ref) => {
    const loginRef = useRef<GoogleOAuthBtnRef>(null);
    const modalRef = useRef<HTMLDialogElement>(null);

    const [visible, setVisible] = useState(false);
    const user = useUser((state) => state.user);
    const setCredits = useUser((state) => state.setCredits);

    // 错误处理
    const { handleError, withErrorHandling, clearError } = useErrorHandler({
      showToast: true,
      onError: (error) => {
        console.error("ImageGenerator Error Detail:", {
          component: "ImageGenerator",
          error: {
            title: error.title,
            message: error.message,
            code: error.code,
            severity: error.severity
          },
          timestamp: new Date().toISOString()
        });
      }
    });
    const { validateFile } = useFileValidation();
    const { validatePrompt } = usePromptValidation();

    // 生成模式
    const [mode, setMode] = useState<"image-to-image" | "text-to-image">("image-to-image");
    
    // 图片相关
    const [file, setFile] = useState<File>();
    const fileUrl = useMemo(() => {
      if (!file) return null;
      return URL.createObjectURL(file);
    }, [file]);

    // 提示词
    const [prompt, setPrompt] = useState("");
      
    // AI模型选择
    const [selectedModel, setSelectedModel] = useState<string>("nano-banana");

    // 🔧 优化：简化状态管理 - 使用单一的 generationState
    type GenerationState = 'idle' | 'submitting' | 'generating' | 'completed' | 'failed';
    const [generationState, setGenerationState] = useState<GenerationState>('idle');

    const [tasks, setTasks] = useTasks<
      AiImageResult["tasks"][number] & { progress: number }
    >({
      onUpdateTask: async (task) => {
        const res = await fetch(`/api/task/${task.task_no}`);
        if (res.ok) {
          const result = await res.json<TaskResult>();
          const { task: updatedTask, progress } = result;
          
          // 🔧 优化：检查任务是否完成，更新 generationState
          const updatedTaskWithProgress = { ...updatedTask, progress };
          if (updatedTask.status === "succeeded") {
            setGenerationState('completed');
          } else if (updatedTask.status === "failed") {
            setGenerationState('failed');
          }
          
          return updatedTaskWithProgress;
        }
        return task;
      },
      taskKey: "task_no",
      verifySuccess: (task) => ["failed", "succeeded"].includes(task.status),
      intervalMs: 3000, // 🔧 减少轮询间隔到3秒，提供更好的用户体验
      immediate: true,
    });

    const generationModes: GenerationMode[] = [
      {
        id: "image-to-image",
        name: "Image to Image",
        icon: <ImageIcon size={20} />,
        description: "Transform your image with AI-powered editing"
      },
      {
        id: "text-to-image", 
        name: "Text to Image",
        icon: <Type size={20} />,
        description: "Create images from text descriptions"
      }
    ];

    // AI模型配置 - 简化版，只保留Nano Banana模型
    const aiModels = {
      "text-to-image": [
        {
          id: "nano-banana",
          name: "Nano Banana",
          description: "🍌 快速生成 | 经济实惠",
          credits: 1
        }
      ],
      "image-to-image": [
        {
          id: "nano-banana-edit",
          name: "Nano Banana Edit",
          description: "🍌 快速编辑 | 经济实惠",
          credits: 1
        }
      ]
    };

    // 获取当前模式可用的AI模型
    const availableModels = aiModels[mode] || [];

    // 确保选中的模型在当前模式下可用
    const isSelectedModelValid = availableModels.some(model => model.id === selectedModel);
    if (!isSelectedModelValid && availableModels.length > 0) {
      setSelectedModel(availableModels[0].id);
    }

    useImperativeHandle(ref, () => ({
      open: handleOpen,
      close: () => modalRef.current?.close(),
    }));

    const handleOpen = (initialFile?: File) => {
      if (!modalRef.current) return;
      if (initialFile) {
        setFile(initialFile);
        setMode("image-to-image");
      }
      modalRef.current.showModal();
      setVisible(true);
    };

    const handleClose = () => {
      setVisible(false);
      setFile(undefined);
      setPrompt("");
      setGenerationState('idle');
      setTasks([]);
    };

    const handleFileUpload = useCallback((uploadedFile: File) => {
      // 文件验证
      if (!validateFile(uploadedFile)) {
        return;
      }

      setFile(uploadedFile);
      if (mode === "text-to-image") {
        setMode("image-to-image");
      }
      
      // 清除之前的错误
      clearError();
    }, [mode, validateFile, clearError]);

    const handleSubmit = async () => {
      // 开始前端数据收集日志监控
      const requestId = FrontendLogger.startImageGeneration({
        mode,
        prompt,
        hasFile: !!file,
        model: selectedModel,
        userId: user?.email
      });

      const startTime = performance.now();
      let validationErrors: string[] = [];

      // 验证提示词
      if (!validatePrompt(prompt)) {
        validationErrors.push('Invalid prompt');
        FrontendLogger.logDataCollectionError({
          type: 'validation_error',
          message: 'Prompt validation failed',
          code: 'INVALID_PROMPT'
        });
        return;
      }
      
      // 验证模式和文件
      if (mode === "image-to-image" && !file) {
        validationErrors.push('Missing reference image');
        FrontendLogger.logDataCollectionError({
          type: 'validation_error',
          message: '图片转图片模式需要上传一张参考图片',
          code: 'MISSING_REQUIRED_PARAM'
        });
        handleError({
          title: "缺少参考图片",
          message: "图片转图片模式需要上传一张参考图片",
          action: "上传图片",
          severity: "warning",
          code: "MISSING_REQUIRED_PARAM"
        });
        return;
      }
      
      if (!user && loginRef.current) {
        FrontendLogger.logDataCollectionError({
          type: 'authentication_error',
          message: 'User not authenticated',
          code: 'UNAUTHORIZED'
        });
        loginRef.current.login();
        return;
      }

      setGenerationState('submitting');
      clearError();

      // 记录前端数据收集完成
      const endTime = performance.now();
      FrontendLogger.completeDataCollection({
        processingTime: endTime - startTime,
        validationErrors
      });

      // 开始API请求日志监控
      FrontendLogger.logApiRequestStart({
        url: '/api/create/ai-image',
        method: 'POST'
      });

      try {
        let imageUrl: string | undefined;
        
        // 如果是image-to-image模式，先上传图片获取URL
        if (file && mode === "image-to-image") {
          const uploadFormData = new FormData();
          uploadFormData.set("image", file);
          
          const uploadRes = await fetch("/api/upload/image", {
            method: "POST",
            body: uploadFormData,
          });
          
          if (!uploadRes.ok) {
             const uploadError = await uploadRes.json().catch(() => ({ error: "Upload failed" })) as { error?: string };
             throw {
               status: uploadRes.status,
               message: uploadError.error || "图片上传失败",
               details: uploadError
             };
           }
           
           const uploadResult = await uploadRes.json() as { imageUrl: string; fileName: string; fileSize: number; fileType: string };
           imageUrl = uploadResult.imageUrl;
           
           // 🔧 时序优化：验证图片URL是否可访问（增强重试机制）
           console.log("📋 验证图片URL可访问性:", imageUrl);
           let imageAccessible = false;
           const maxRetries = 3;
           const retryDelays = [1000, 2000, 3000]; // 1秒, 2秒, 3秒
           
           for (let attempt = 0; attempt < maxRetries; attempt++) {
             try {
               const checkRes = await fetch(imageUrl, { 
                 method: 'HEAD',
                 cache: 'no-cache' // 确保不使用缓存
               });
               
               if (checkRes.ok) {
                 console.log(`✅ 图片URL验证成功 (尝试 ${attempt + 1})`);
                 imageAccessible = true;
                 break;
               } else {
                 console.warn(`⚠️ 图片URL返回 ${checkRes.status} (尝试 ${attempt + 1}/${maxRetries})`);
               }
             } catch (error) {
               console.warn(`⚠️ 图片URL检查失败 (尝试 ${attempt + 1}/${maxRetries}):`, error);
             }
             
             // 如果不是最后一次尝试，等待后重试
             if (attempt < maxRetries - 1) {
               console.log(`⏳ 等待 ${retryDelays[attempt]}ms 后重试...`);
               await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
             }
           }
           
           if (!imageAccessible) {
             console.warn("⚠️ 图片URL在多次重试后仍不可访问，但继续处理（可能是CDN延迟）");
           }
        }
        
        // 发送JSON格式的请求
        const requestData = {
          mode,
          prompt,
          type: selectedModel,
          ...(imageUrl && { image: imageUrl })
        };
        
        const res = await fetch("/api/create/ai-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestData),
        });

        if (!res.ok) {
          // 解析后端返回的标准化错误响应
          const errorData = await res.json().catch(() => ({ message: "Unknown error" })) as any;
          throw {
            status: res.status,
            data: errorData,
            message: errorData.error?.message || errorData.message || errorData.error || `HTTP ${res.status}`,
            details: errorData
          };
        }

        const result = await res.json<AiImageResult>();
        const { tasks, consumptionCredits } = result;

        // 记录API请求成功
        const apiEndTime = performance.now();
        FrontendLogger.logApiRequestComplete({
          status: res.status,
          responseTime: apiEndTime - endTime,
          success: true
        });

        setCredits(consumptionCredits.remainingBalance);
        
        // 🔧 修复：为不同状态的任务设置正确的progress
        setTasks(tasks.map((item: AiImageResult["tasks"][number]) => ({ 
          ...item, 
          progress: item.status === "running" ? 10 : // running状态显示10%进度
                   item.status === "succeeded" ? 100 : 
                   item.status === "failed" ? 100 : 0
        })));
        setGenerationState('generating');
        
        console.log("📋 任务创建成功:", tasks.map(t => `${t.task_no} (${t.status})`).join(", "));
        
        // 成功后清理错误状态
        clearError();
        
      } catch (error: any) {
        // 记录API请求失败
        const apiEndTime = performance.now();
        FrontendLogger.logApiRequestComplete({
          status: error.status || 0,
          responseTime: apiEndTime - endTime,
          success: false
        });

        console.error("ImageGenerator Submit Error:", {
          error: error,
          message: error.message,
          stack: error.stack,
          mode,
          selectedModel,
          hasFile: !!file,
          promptLength: prompt.length
        });
                
        handleError(error, "Image generation");
        setGenerationState('failed');
        
        // 特殊错误处理
        if (error.status === 401 && loginRef.current) {
          loginRef.current.login();
        }
      }
    };

    const canGenerate = prompt.trim() && (mode === "text-to-image" || file);
    const isGenerating = generationState === 'submitting' || generationState === 'generating';

    // 🎨 右侧面板状态组件
    const IdleState = () => (
      <div className="h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <ImageIcon size={32} className="text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Ready for instant generation</h3>
          <p className="text-sm text-gray-500 mb-4">Enter your prompt and unleash the power</p>
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>AI models ready</span>
          </div>
        </div>
      </div>
    );

    const SubmittingState = () => (
      <div className="h-96 border border-blue-200 bg-blue-50/30 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-lg font-semibold text-blue-700 mb-2">Submitting to AI service</h3>
          <p className="text-sm text-blue-600">Validating your request and preparing generation...</p>
          <div className="mt-4 w-64 h-1 bg-blue-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );

    const GeneratingState = ({ tasks }: { tasks: typeof tasks }) => (
      <div className="space-y-4 max-h-[80vh] overflow-y-auto">
        {tasks.map((task) => (
          <div key={task.task_no} className="bg-white border-2 border-blue-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-gray-800">Task {task.task_no}</span>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Generating</span>
              </span>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">AI Processing</span>
                <span className="text-sm font-bold text-blue-600">{task.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-500 ease-out relative"
                  style={{ width: `${task.progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Creating your masterpiece...</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Estimated time: 30-60 seconds</p>
            </div>
          </div>
        ))}
      </div>
    );

    const CompletedState = ({ tasks }: { tasks: typeof tasks }) => (
      <div className="space-y-4 max-h-[80vh] overflow-y-auto">
        {tasks.map((task) => (
          <div key={task.task_no} className="bg-white border-2 border-green-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-semibold text-gray-800">Task {task.task_no}</span>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Complete</span>
              </span>
            </div>
            
            {task.result_url && (
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-2">
                <Image
                  src={task.result_url}
                  alt="Generated Result"
                  className="w-full rounded-md shadow-sm hover:shadow-md transition-shadow duration-200"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );

    const FailedState = ({ tasks }: { tasks: typeof tasks }) => (
      <div className="space-y-4 max-h-[80vh] overflow-y-auto">
        {tasks.map((task) => (
          <div key={task.task_no} className="bg-white border-2 border-red-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="font-semibold text-gray-800">Task {task.task_no}</span>
              </div>
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>Failed</span>
              </span>
            </div>
            
            {task.fail_reason && (
              <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Generation Failed</h4>
                    <p className="text-sm text-red-700 mt-1">{task.fail_reason}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );

    // 🎨 右侧面板主组件
    const OutputGallery = () => {
      const renderContent = () => {
        switch (generationState) {
          case 'idle':
            return <IdleState />;
          case 'submitting':
            return <SubmittingState />;
          case 'generating':
            return <GeneratingState tasks={tasks} />;
          case 'completed':
            return <CompletedState tasks={tasks} />;
          case 'failed':
            return <FailedState tasks={tasks} />;
          default:
            return <IdleState />;
        }
      };

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-800">🎨 Output Gallery</h3>
              <div className={clsx(
                "px-2 py-1 rounded-full text-xs font-medium",
                generationState === 'idle' && "bg-gray-100 text-gray-600",
                generationState === 'submitting' && "bg-blue-100 text-blue-600",
                generationState === 'generating' && "bg-blue-100 text-blue-600", 
                generationState === 'completed' && "bg-green-100 text-green-600",
                generationState === 'failed' && "bg-red-100 text-red-600"
              )}>
                {generationState === 'idle' && 'Ready'}
                {generationState === 'submitting' && 'Submitting'}
                {generationState === 'generating' && 'Processing'}
                {generationState === 'completed' && 'Complete'}
                {generationState === 'failed' && 'Failed'}
              </div>
            </div>
            {generationState === 'completed' && (
              <button 
                onClick={() => setGenerationState('idle')}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                New Generation
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600">Your ultra-fast AI creations appear here instantly</p>
          {renderContent()}
        </div>
      );
    };

    // 控件内容组件
    const ControlsContent = () => (
      <>
        {/* Prompt Engine Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">🚀 Prompt Engine</h2>
          <p className="text-gray-600 text-sm">Transform your image with AI-powered editing</p>
          <div className="w-full h-px bg-gray-200 mt-4"></div>
        </div>

        {/* Generation Mode Tabs */}
        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            {generationModes.map((modeOption) => (
              <button
                key={modeOption.id}
                onClick={() => setMode(modeOption.id)}
                className={clsx(
                  "px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center space-x-2",
                  mode === modeOption.id
                    ? "border-blue-500 text-blue-600 bg-blue-50/50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                {modeOption.icon}
                <span>{modeOption.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Reference Image Upload */}
        {mode === "image-to-image" && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Reference Image</label>
              <span className="text-xs text-gray-500">0/9</span>
            </div>
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-gray-300 transition-colors">
              {fileUrl ? (
                <div className="relative">
                  <Image
                    src={fileUrl}
                    alt="Reference"
                    className="max-h-40 mx-auto rounded-lg shadow-sm"
                  />
                  <button
                    onClick={() => setFile(undefined)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ImageIcon size={32} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Add Image</p>
                  <p className="text-xs text-gray-400 mb-4">Max 50MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    Choose File
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Model Selection */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-3 block">
            AI 模型选择
          </label>
          <div className="grid grid-cols-1 gap-3">
            {availableModels.map((model) => {
              const isSelected = selectedModel === model.id;
              return (
                <label
                  key={model.id}
                  className={clsx(
                    "flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all",
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <input
                    type="radio"
                    name="aiModel"
                    value={model.id}
                    checked={isSelected}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <div className={clsx(
                          "w-4 h-4 rounded-full border-2 transition-colors",
                          isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                        )}>
                          {isSelected && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">{model.name}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <span>{model.credits}</span>
                        <span>积分</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 ml-6">{model.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Main Prompt */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Main Prompt</label>
            <button className="text-xs text-blue-600 hover:text-blue-700 transition-colors">Copy</button>
          </div>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to create..."
              className="w-full h-24 p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {prompt.length}/1000
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleSubmit}
          disabled={!canGenerate || isGenerating}
          className={clsx(
            "w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2",
            canGenerate && !isGenerating
              ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              : "bg-gray-300 cursor-not-allowed"
          )}
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>
                {generationState === 'submitting' ? 'Submitting...' : 'Generating...'}
              </span>
            </>
          ) : (
            <>
              <Wand2 size={20} />
              <span>Generate Now</span>
            </>
          )}
        </button>

        {/* 🔧 移除Generate Now按钮下方的结果显示，只在右侧面板显示 */}
      </>
    );

    // Inline 模式直接返回控件内容
    if (inline) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-6">
            <ControlsContent />
          </div>
          {/* Hidden OAuth for programmatic login */}
          <div className="hidden">
            <GoogleOAuth ref={loginRef} />
          </div>
        </div>
      );
    }

    // 模态框模式

    return (
      <dialog
        ref={modalRef}
        className="modal modal-bottom sm:modal-middle"
        onClose={handleClose}
      >
        {visible && (
          <div className="modal-box max-w-7xl w-full max-h-[90vh] p-0">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold">Nano Banana AI Generator</h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => modalRef.current?.close()}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row h-full">
              {/* Left Panel - Controls */}
              <div className="lg:w-1/2 p-6 space-y-6">
                <ControlsContent />
              </div>

              {/* Right Panel - Output Gallery */}
              <div className="lg:w-1/2 bg-gray-50 p-6">
                <OutputGallery />
              </div>
            </div>
          </div>
        )}
      </dialog>
    );
  }
);

ImageGenerator.displayName = "ImageGenerator";