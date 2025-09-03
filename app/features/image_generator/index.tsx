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
    const [negativePrompt, setNegativePrompt] = useState("");

    // 样式选择
    const [selectedStyle, setSelectedStyle] = useState<string>("");
      
    // AI模型选择
    const [selectedModel, setSelectedModel] = useState<string>("nano-banana");

    // 生成状态
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const [tasks, setTasks] = useTasks<
      AiImageResult["tasks"][number] & { progress: number }
    >({
      onUpdateTask: async (task) => {
        const res = await fetch(`/api/task/${task.task_no}`);
        if (res.ok) {
          const result = await res.json<TaskResult>();
          const { task: updatedTask, progress } = result;
          return { ...updatedTask, progress };
        }
        return task;
      },
      taskKey: "task_no",
      verifySuccess: (task) => ["failed", "succeeded"].includes(task.status),
      intervalMs: 8000,
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

    // AI模型配置
    const aiModels = {
      "text-to-image": [
        {
          id: "nano-banana",
          name: "Nano Banana",
          description: "🍌 经济实惠 | 快速生成",
          credits: 1,
          recommended: true
        },
        {
          id: "gpt-4o",
          name: "GPT-4o",
          description: "🚀 高质量 | 专业级",
          credits: 2
        },
        {
          id: "kontext",
          name: "Flux Kontext",
          description: "🎨 艺术风格 | 创意表达",
          credits: 1
        }
      ],
      "image-to-image": [
        {
          id: "nano-banana-edit",
          name: "Nano Banana Edit",
          description: "🍌 快速编辑 | 经济实惠",
          credits: 1,
          recommended: true
        },
        {
          id: "gpt-4o",
          name: "GPT-4o",
          description: "🚀 专业编辑 | 高质量",
          credits: 3
        },
        {
          id: "kontext",
          name: "Flux Kontext",
          description: "🎨 风格转换 | 艺术效果",
          credits: 2
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
      setNegativePrompt("");
      setSelectedStyle("");
      setSubmitting(false);
      setDone(false);
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
      // 验证提示词
      if (!validatePrompt(prompt)) {
        return;
      }
      
      // 验证模式和文件
      if (mode === "image-to-image" && !file) {
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
        loginRef.current.login();
        return;
      }

      setSubmitting(true);
      clearError();

      try {
        const formData = new FormData();

        if (file && mode === "image-to-image") {
          formData.set("image", file);
        }
        formData.set("mode", mode);
        formData.set("prompt", prompt);
        formData.set("negative_prompt", negativePrompt);
        formData.set("style", selectedStyle);
        formData.set("type", selectedModel);

        const res = await fetch("/api/create/ai-image", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          // 使用统一的HTTP错误处理
          const errorData = await res.json().catch(() => ({ message: "Unknown error" })) as any;
          throw {
            status: res.status,
            message: errorData.message || errorData.error || `HTTP ${res.status}`,
            details: errorData
          };
        }

        const result = await res.json<AiImageResult>();
        const { tasks, consumptionCredits } = result;

        setCredits(consumptionCredits.remainingBalance);
        setTasks(tasks.map((item) => ({ ...item, progress: 0 })));
        setDone(true);
        
        // 成功后清理错误状态
        clearError();
        
      } catch (error: any) {
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
        
        // 特殊错误处理
        if (error.status === 401 && loginRef.current) {
          loginRef.current.login();
        }
      } finally {
        setSubmitting(false);
      }
    };

    const canGenerate = prompt.trim() && (mode === "text-to-image" || file);

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
                        {model.recommended && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            推荐
                          </span>
                        )}
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

        {/* Style Selection */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-3 block">Style (Optional)</label>
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm bg-white"
          >
            <option value="">No specific style</option>
            {styles.map((style) => (
              <option key={style.value} value={style.value}>
                {style.name} - {style.description}
              </option>
            ))}
          </select>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleSubmit}
          disabled={!canGenerate || submitting}
          className={clsx(
            "w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2",
            canGenerate && !submitting
              ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              : "bg-gray-300 cursor-not-allowed"
          )}
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Wand2 size={20} />
              <span>Generate Now</span>
            </>
          )}
        </button>

        {/* Result Display for inline mode */}
        {inline && done && tasks.length > 0 && (
          <div className="mt-8 p-6 bg-white border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">🎨 Generated Results</h3>
              <span className="text-xs text-gray-500">{tasks.length} image(s)</span>
            </div>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.task_no} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="font-medium text-sm">Task {task.task_no}</span>
                    </div>
                    <span className={clsx(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      task.status === "succeeded" && "bg-green-100 text-green-700",
                      task.status === "failed" && "bg-red-100 text-red-700",
                      task.status === "running" && "bg-yellow-100 text-yellow-700",
                    )}>
                      {task.status === "succeeded" && "✓ Complete"}
                      {task.status === "failed" && "⚠ Failed"}
                      {task.status === "running" && "⌛ Running"}
                    </span>
                  </div>
                  
                  {task.status === "running" && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-blue-600">{task.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {task.result_url && (
                    <div className="bg-white rounded-lg p-2 border">
                      <Image
                        src={task.result_url}
                        alt="Generated"
                        className="w-full rounded-lg shadow-sm"
                      />
                      <div className="flex items-center justify-between mt-2 px-2">
                        <span className="text-xs text-gray-500">Generated in 0.8s</span>
                        <button className="text-xs text-blue-600 hover:text-blue-700 transition-colors">
                          Download
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
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

              {/* Right Panel - Output */}
              <div className="lg:w-1/2 bg-gray-50 p-6">
                <h3 className="text-lg font-semibold mb-4">Output Gallery</h3>
                
                {!done && !submitting && (
                  <div className="h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon size={64} className="mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">Ready for instant generation</p>
                      <p className="text-sm text-gray-400">Enter your prompt and unleash the power</p>
                    </div>
                  </div>
                )}

                {submitting && (
                  <div className="h-96 border border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="loading loading-spinner loading-lg mb-4"></div>
                      <p className="text-gray-500">Generating your image...</p>
                    </div>
                  </div>
                )}

                {done && tasks.length > 0 && (
                  <div className="space-y-4">
                    {tasks.map((task) => (
                      <div key={task.task_no} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Task {task.task_no}</span>
                          <span className={clsx(
                            "badge",
                            task.status === "succeeded" && "badge-success",
                            task.status === "failed" && "badge-error",
                            task.status === "running" && "badge-warning",
                          )}>
                            {task.status}
                          </span>
                        </div>
                        
                        {task.status === "running" && (
                          <div className="mb-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{task.progress}%</span>
                            </div>
                            <progress className="progress progress-primary w-full" value={task.progress} max="100"></progress>
                          </div>
                        )}

                        {task.result_url && (
                          <Image
                            src={task.result_url}
                            alt="Generated"
                            className="w-full rounded"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </dialog>
    );
  }
);

ImageGenerator.displayName = "ImageGenerator";