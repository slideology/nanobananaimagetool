import clsx from "clsx";
import {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { useUser } from "~/store";
import { useTasks } from "~/hooks/data";
import { useErrorHandler, useFileValidation, usePromptValidation } from "~/hooks/use-error-handler";

import { GoogleOAuth, type GoogleOAuthBtnRef } from "~/features/oauth";
import { CreditRechargeModal, type CreditRechargeModalRef, TurnstileVerification } from "~/components/ui";
import { X, ImageIcon, Type, Wand2, ChevronDown, Check } from "lucide-react";
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
  // 新增：产品配置信息，用于充值弹窗
  product?: {
    price: number;
    credits: number;
    product_id: string;
    product_name: string;
    type: "once" | "monthly" | "yearly";
  };
}

export const ImageGenerator = forwardRef<ImageGeneratorRef, ImageGeneratorProps>(
  ({ styles, promptCategories, inline = false, product }, ref) => {
    const loginRef = useRef<GoogleOAuthBtnRef>(null);
    const modalRef = useRef<HTMLDialogElement>(null);
    const rechargeModalRef = useRef<CreditRechargeModalRef>(null);

    const [visible, setVisible] = useState(false);
    const user = useUser((state) => state.user);
    const credits = useUser((state) => state.credits);
    const setCredits = useUser((state) => state.setCredits);

    // 临时积分相关状态
    const getTotalCredits = useUser((state) => state.getTotalCredits);
    const useGuestCredit = useUser((state) => state.useGuestCredit);
    const rollbackGuestCredit = useUser((state) => state.rollbackGuestCredit);
    const getGuestCreditStatus = useUser((state) => state.getGuestCreditStatus);

    // 监听充值弹窗状态
    // 分开选择，避免返回新对象导致的无意义渲染
    const showRechargeModal = useUser(state => state.showRechargeModal);
    const rechargeModalData = useUser(state => state.rechargeModalData);
    const hideRechargeDialog = useUser(state => state.hideRechargeDialog);

    // 错误处理（启用积分不足弹窗处理）
    const { handleError, withErrorHandling, clearError } = useErrorHandler({
      showToast: true,
      enableCreditModal: true, // 启用积分不足弹窗
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

    // 生成状态
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    // Turnstile验证状态
    const [showVerification, setShowVerification] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [verificationError, setVerificationError] = useState<string>("");

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
      intervalMs: 3000, // 🔧 减少轮询间隔到3秒，提供更好的用户体验
      immediate: true,
    });

    const generationModes: GenerationMode[] = [
      {
        id: "image-to-image",
        name: "Image to Image",
        icon: <ImageIcon size={20} />,
        description: "Transform your photos with AI-powered editing"
      },
      {
        id: "text-to-image",
        name: "Text to Image",
        icon: <Type size={20} />,
        description: "Create photos from text descriptions"
      }
    ];

    // AI模型配置 - 简化版，只保留Nano Banana模型
    const aiModels = {
      "text-to-image": [
        {
          id: "nano-banana",
          name: "Nano Banana",
          description: "🍌 Fast Generation | Affordable",
          credits: 1
        }
      ],
      "image-to-image": [
        {
          id: "nano-banana-edit",
          name: "Nano Banana Edit",
          description: "🍌 Fast Editing | Affordable",
          credits: 1
        }
      ]
    };

    // 获取当前模式可用的AI模型
    const availableModels = aiModels[mode] || [];

    // ✅ 正确：使用useEffect来处理模型验证和更新
    useEffect(() => {
      const isSelectedModelValid = availableModels.some(model => model.id === selectedModel);
      if (!isSelectedModelValid && availableModels.length > 0) {
        setSelectedModel(availableModels[0].id);
      }
    }, [selectedModel, availableModels, mode]);

    // 监听充值弹窗状态，自动打开弹窗
    // 防抖标记，确保一次显示周期内仅触发一次
    const openedRechargeRef = useRef(false);
    useEffect(() => {
      if (showRechargeModal && rechargeModalRef.current && product && !openedRechargeRef.current) {
        openedRechargeRef.current = true;
        rechargeModalRef.current.open(rechargeModalData?.currentCredits || 0);
        // 立即复位store标记，避免其他组件再次触发
        hideRechargeDialog();
      }
      if (!showRechargeModal) {
        // 当外部标记为false时，允许下次再触发
        openedRechargeRef.current = false;
      }
    }, [showRechargeModal, product, rechargeModalData, hideRechargeDialog]);

    // 处理充值成功回调
    const handleRechargeSuccess = useCallback(() => {
      hideRechargeDialog();
      // 充值成功后可以提示用户继续操作
      console.log('充值成功，用户可以继续生图操作');
    }, [hideRechargeDialog]);

    // 处理充值取消回调
    const handleRechargeCancel = useCallback(() => {
      hideRechargeDialog();
    }, [hideRechargeDialog]);

    // 处理图片下载 (解决跨域 CDN 资源下载问题)
    const handleDownloadImage = useCallback(async (imageUrl: string | null, taskNo: string) => {
      try {
        // 检查 imageUrl 是否有效
        if (!imageUrl) {
          console.error('图片 URL 为空');
          return;
        }

        // 1. 使用 fetch 获取图片数据
        const proxyUrl = `/api/download-image?url=${encodeURIComponent(imageUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch image');
        }

        // 2. 将响应转换为 blob
        const blob = await response.blob();

        // 3. 创建临时 blob URL
        const blobUrl = URL.createObjectURL(blob);

        // 4. 创建隐藏的 <a> 标签并触发下载
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `nanobananaimage.org-${taskNo}.png`;
        document.body.appendChild(link);
        link.click();

        // 5. 清理:移除 <a> 标签和释放 blob URL
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);

        console.log('图片下载成功:', taskNo);
      } catch (error) {
        console.error('图片下载失败:', error);
        handleError({
          title: "下载失败",
          message: "无法下载图片,请稍后重试或右键保存图片",
          severity: "error",
          code: "DOWNLOAD_ERROR"
        });
      }
    }, [handleError]);

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

    // Turnstile验证回调函数
    const handleTurnstileSuccess = useCallback((token: string) => {
      setTurnstileToken(token);
      setVerificationError("");
      setShowVerification(false);
      console.log("Turnstile verification successful");
    }, []);

    const handleTurnstileError = useCallback((error: string) => {
      setTurnstileToken(null);
      setVerificationError(error);
      console.error("Turnstile verification error:", error);
    }, []);

    const handleTurnstileExpire = useCallback(() => {
      setTurnstileToken(null);
      setVerificationError("Verification expired. Please try again.");
      console.warn("Turnstile verification expired");
    }, []);

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
          message: 'Image-to-image mode requires uploading a reference image',
          code: 'MISSING_REQUIRED_PARAM'
        });
        handleError({
          title: "Missing Reference Image",
          message: "Image-to-image mode requires uploading a reference image",
          action: "Upload Image",
          severity: "warning",
          code: "MISSING_REQUIRED_PARAM"
        });
        return;
      }

      // 获取当前总积分（包括临时积分）
      const totalCredits = getTotalCredits();
      const guestStatus = getGuestCreditStatus();

      // 如果用户未登录且没有临时积分，提示登录
      if (!user && !guestStatus.hasCredits) {
        if (loginRef.current) {
          FrontendLogger.logDataCollectionError({
            type: 'authentication_error',
            message: 'User not authenticated and no guest credits',
            code: 'UNAUTHORIZED'
          });
          loginRef.current.login();
        }
        return;
      }

      // 如果用户未登录且使用image-to-image模式，需要Turnstile验证
      if (!user && mode === "image-to-image" && !turnstileToken) {
        setShowVerification(true);
        setVerificationError("");
        FrontendLogger.logDataCollectionError({
          type: 'verification_required',
          message: 'Turnstile verification required for guest image upload',
          code: 'VERIFICATION_REQUIRED'
        });
        return;
      }

      // 如果用户已登录，刷新一次账户信息，确保credits最新
      if (user) {
        try {
          const res = await fetch("/api/auth");
          if (res.ok) {
            const data = await res.json().catch(() => null) as { profile: UserInfo | null; credits: number } | null;
            if (data) setCredits(data.credits);
          }
        } catch { }
      }

      // 检查总积分是否足够
      if (totalCredits < 1) {
        if (product && rechargeModalRef.current) {
          rechargeModalRef.current.open(user ? credits : 0);
        }
        return;
      }

      // 🔒 时序优化：预扣积分，API失败时回滚
      let guestCreditUsed = false;
      if (!user && guestStatus.hasCredits) {
        guestCreditUsed = useGuestCredit();
        if (!guestCreditUsed) {
          console.error("Failed to use guest credit");
          return;
        }
      }

      setSubmitting(true);
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

          // 如果用户未登录，添加Turnstile token
          if (!user && turnstileToken) {
            uploadFormData.set("cf-turnstile-response", turnstileToken);
          }

          const uploadRes = await fetch("/api/upload/image", {
            method: "POST",
            body: uploadFormData,
          });

          if (!uploadRes.ok) {
            const uploadError = await uploadRes.json().catch(() => ({ error: "Upload failed" })) as { error?: string };
            throw {
              status: uploadRes.status,
              message: uploadError.error || "Image upload failed",
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
          ...(imageUrl && { image: imageUrl }),
          // 如果用户未登录，传递临时积分状态
          ...(!user && { hasGuestCredit: guestStatus.hasCredits })
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
          const richError = {
            status: res.status,
            data: errorData,
            message: errorData.error?.message || errorData.message || errorData.error || `HTTP ${res.status}`,
            details: errorData
          } as any;

          // 如果是积分不足错误，弹出充值弹窗
          const code = errorData?.error?.code;
          if ((res.status === 402 || code === 'INSUFFICIENT_CREDITS' || code === 'BIZ_001') && product && rechargeModalRef.current) {
            rechargeModalRef.current.open(credits || 0);
          }

          throw richError;
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

        // 处理积分扣除：如果用户已登录，更新持久积分；临时积分已预扣，无需再次扣除
        if (user) {
          setCredits(consumptionCredits.remainingBalance);
        }
        // 注意：未登录用户的临时积分已在API调用前预扣，这里无需再次处理

        // 🔧 修复状态设置时序：先设置任务，再设置done状态
        const tasksWithProgress = tasks.map((item: AiImageResult["tasks"][number]) => ({
          ...item,
          progress: item.status === "running" ? 0 : // running状态从0%开始，由轮询更新
            item.status === "succeeded" ? 100 :
              item.status === "failed" ? 100 : 0
        }));

        setTasks(tasksWithProgress);

        // 🔧 延迟设置done状态，确保UI有时间显示提交完成到任务开始的过渡
        setTimeout(() => {
          setDone(true);
        }, 500); // 500ms延迟，让用户看到"提交成功"的状态

        console.log("📋 任务创建成功:", tasks.map(t => `${t.task_no} (${t.status})`).join(", "));

        // 成功后清理错误状态
        clearError();

      } catch (error: any) {
        // 🔒 时序优化：API失败时回滚临时积分
        if (guestCreditUsed && !user) {
          const rollbackSuccess = rollbackGuestCredit();
          console.log("Guest credit rollback:", rollbackSuccess ? "success" : "failed");
        }

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
          promptLength: prompt.length,
          guestCreditUsed,
          rollbackAttempted: guestCreditUsed && !user
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
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <Wand2 size={18} className="text-gray-700" />
          <h3 className="text-base font-semibold text-gray-900">Create AI Image</h3>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setMode('text-to-image')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'text-to-image'
              ? 'bg-purple-50 text-purple-700 border border-purple-200'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            <Type size={16} />
            <span>Text to Image</span>
          </button>
          <button
            onClick={() => setMode('image-to-image')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'image-to-image'
              ? 'bg-purple-50 text-purple-700 border border-purple-200'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            <ImageIcon size={16} />
            <span>Image to Image</span>
          </button>
        </div>

        {/* Model Selector (Simplified Dropdown Look) */}
        <div className="mb-5 relative">
          <label className="block text-xs font-medium text-gray-600 mb-2">Model</label>
          <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg border border-transparent hover:bg-gray-100 transition-colors cursor-pointer">
            <span className="text-sm font-medium text-gray-900">Nano Banana AI</span>
            <ChevronDown size={16} className="text-gray-400" />
          </div>
        </div>

        {/* Reference Image Upload (img2img only) */}
        {mode === 'image-to-image' && (
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-600 mb-2">Reference Image</label>

            {/* Guest Warning */}
            {!user && (
              <div className="mb-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[10px] font-bold">!</span>
                </div>
                <p className="text-xs text-blue-700">
                  {turnstileToken ? "Verification completed" : "Verification required for guest upload"}
                </p>
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-lg py-6 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-all relative group">
              {fileUrl ? (
                <div className="relative inline-block">
                  <img src={fileUrl} alt="Reference" className="h-32 rounded-lg object-contain mx-auto" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(undefined); }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div onClick={() => document.getElementById('image-upload-input')?.click()}>
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <ImageIcon size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-700">
                    Drag & drop or <span className="font-semibold text-purple-600">click to upload</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP (Max 10MB)</p>
                </div>
              )}

              <input
                id="image-upload-input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Prompt Input */}
        <div className="mb-5 relative">
          <label className="block text-xs font-medium text-gray-600 mb-2">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to create..."
            className="w-full h-32 px-3 py-3 text-sm text-gray-700 placeholder-gray-400 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none shadow-sm"
            maxLength={1000}
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-400 pointer-events-none">
            {prompt.length}/1000
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleSubmit}
          disabled={!canGenerate || submitting}
          className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${canGenerate && !submitting
            ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg"
            : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
            }`}
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Wand2 size={16} />
              <span>Generate - 1 Credit</span>
            </>
          )}
        </button>
      </>
    );

    // Inline 模式返回完整的左右布局  
    if (inline) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-7xl mx-auto">
          {/* Left Panel - Controls */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 h-full shadow-sm">
            {ControlsContent()}
          </div>

          {/* Right Panel - Output Gallery */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 h-full shadow-sm">
            <div className="mb-5">
              <h3 className="text-base font-semibold text-gray-900">AI Image Result</h3>
            </div>

            {/* Initial State */}
            {!done && !submitting && (
              <div className="aspect-video bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center mb-3">
                  <ImageIcon className="text-gray-400" size={24} />
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Ready to Create</h4>
                <p className="text-xs text-gray-500 max-w-[200px]">
                  Your generated images will appear here.
                </p>
              </div>
            )}

            {/* Submitting State */}
            {submitting && (
              <div className="aspect-video bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center p-6">
                <div className="loading loading-spinner loading-md text-purple-600 mb-3"></div>
                <p className="text-sm text-gray-600 font-medium">Creating your masterpiece...</p>
                <p className="text-xs text-gray-400 mt-1">This usually takes 10-20 seconds</p>
              </div>
            )}

            {/* Task Succes/Progress/Result */}
            {tasks.length > 0 && (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {tasks.map((task) => (
                  <div key={task.task_no} className="group">
                    {/* Status Badge if running/failed */}
                    {task.status !== 'succeeded' && (
                      <div className={`mb-2 text-xs flex items-center gap-2 ${task.status === 'failed' ? 'text-red-600' : 'text-purple-600'
                        }`}>
                        {task.status === 'failed' ? (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            Generation Failed: {task.fail_reason || 'Unknown error'}
                          </>
                        ) : (
                          <>
                            <div className="loading loading-spinner loading-xs text-purple-600"></div>
                            Processing... {task.progress}%
                          </>
                        )}
                      </div>
                    )}

                    {/* Result Image */}
                    {task.result_url ? (
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm group-hover:shadow-md transition-all bg-gray-50">
                        <Image
                          src={task.result_url}
                          alt="Generated Result"
                          className="w-full h-auto object-contain max-h-[400px]"
                        />
                        {/* Overlay Actions */}
                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                          <button
                            onClick={() => handleDownloadImage(task.result_url, task.task_no)}
                            className="p-2 bg-white/90 hover:bg-white text-gray-900 rounded-lg backdrop-blur-sm transition-colors shadow-sm"
                            title="Download"
                          >
                            <Check size={16} />
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* 功能特性展示 */}
          {!done && !submitting && (
            <div className="mt-6">
              <h4 className="font-medium mb-3 text-gray-700">✨ Core Features</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <h5 className="font-medium text-sm">Natural Language Editing</h5>
                    <p className="text-xs text-gray-600">Edit images using simple text prompts</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  </div>
                  <div>
                    <h5 className="font-medium text-sm">Character Consistency</h5>
                    <p className="text-xs text-gray-600">Maintain character appearance across generations</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hidden OAuth for programmatic login */}
          <div className="hidden">
            <GoogleOAuth ref={loginRef} />
          </div>

          {/* 充值弹窗 */}
          {
            product && (
              <CreditRechargeModal
                ref={rechargeModalRef}
                product={product}
                onPurchaseSuccess={handleRechargeSuccess}
                onCancel={handleRechargeCancel}
              />
            )
          }
        </div >
      );
    }

    // 模态框模式
    return (
      <>
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
                  {ControlsContent()}
                </div>

                {/* Right Panel - Output */}
                <div className="lg:w-1/2 bg-gray-50 p-6">
                  <h3 className="text-lg font-semibold mb-4">Output Gallery</h3>

                  {/* 初始状态：等待用户操作 */}
                  {!done && !submitting && (
                    <div className="h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon size={64} className="mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">Ready for instant generation</p>
                        <p className="text-sm text-gray-400">Enter your prompt and unleash the power</p>
                      </div>
                    </div>
                  )}

                  {/* 提交中状态：正在调用API */}
                  {submitting && (
                    <div className="h-96 border border-gray-300 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="loading loading-spinner loading-lg mb-4"></div>
                        <p className="text-gray-500">Submitting to AI service...</p>
                      </div>
                    </div>
                  )}

                  {/* 任务创建成功过渡状态 */}
                  {!submitting && tasks.length > 0 && !done && (
                    <div className="h-96 border border-green-300 rounded-lg flex items-center justify-center bg-green-50">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-green-700 font-medium mb-2">Task Created Successfully!</p>
                        <p className="text-green-600 text-sm">Initializing AI generation process...</p>
                      </div>
                    </div>
                  )}

                  {/* 任务创建后状态：显示任务进度和结果 */}
                  {done && tasks.length > 0 && (
                    <div className="space-y-4 max-h-[80vh] overflow-y-auto">
                      {tasks.map((task) => (
                        <div key={task.task_no} className="bg-white border rounded-lg p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-gray-800">Image Generation Task</span>
                            <span className={clsx(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              task.status === "succeeded" && "bg-green-100 text-green-700",
                              task.status === "failed" && "bg-red-100 text-red-700",
                              task.status === "running" && "bg-blue-100 text-blue-700",
                            )}>
                              {task.status === "succeeded" && "✓ Complete"}
                              {task.status === "failed" && "✗ Failed"}
                              {task.status === "running" && "⟳ Generating"}
                            </span>
                          </div>

                          {task.status === "running" && (
                            <div className="mb-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="loading loading-spinner loading-sm"></div>
                                <span className="text-sm text-gray-600">
                                  {task.progress === 0 ? "Starting AI generation process..." : "AI is generating image, please wait..."}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-medium text-blue-600">
                                  {task.progress === 0 ? "Initializing" : `${task.progress}%`}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${task.progress === 0
                                    ? "bg-gradient-to-r from-blue-300 to-blue-400 animate-pulse"
                                    : "bg-gradient-to-r from-blue-500 to-purple-500"
                                    }`}
                                  style={{ width: `${Math.max(task.progress, 5)}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {task.result_url && (
                            <div className="border rounded-lg overflow-hidden">
                              <Image
                                src={task.result_url}
                                alt="Generated"
                                className="w-full"
                              />
                              <div className="p-3 border-t bg-gray-50 flex justify-end">
                                <button
                                  onClick={() => handleDownloadImage(task.result_url, task.task_no)}
                                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
                                  aria-label="Download generated image"
                                >
                                  Download
                                </button>
                              </div>
                            </div>
                          )}

                          {task.status === "failed" && task.fail_reason && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                              <strong>Error:</strong> {task.fail_reason}
                            </div>
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

        {/* Turnstile验证弹窗 */}
        {showVerification && (
          <dialog className="modal modal-open">
            <div className="modal-box max-w-md">
              <h3 className="font-bold text-lg mb-4">Verification Required</h3>
              <p className="text-gray-600 mb-6">
                Please complete the verification to upload images. This helps us prevent automated abuse.
              </p>

              <div className="flex justify-center mb-6">
                <TurnstileVerification
                  siteKey="1x00000000000000000000AA" // Demo key - will be replaced with real key in production
                  onSuccess={handleTurnstileSuccess}
                  onError={handleTurnstileError}
                  onExpire={handleTurnstileExpire}
                  theme="light"
                  size="normal"
                />
              </div>

              {verificationError && (
                <div className="alert alert-error mb-4">
                  <span>{verificationError}</span>
                </div>
              )}

              <div className="modal-action">
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowVerification(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </dialog>
        )}

        {/* 充值弹窗 */}
        {product && (
          <CreditRechargeModal
            ref={rechargeModalRef}
            product={product}
            onPurchaseSuccess={handleRechargeSuccess}
            onCancel={handleRechargeCancel}
          />
        )}
      </>
    );
  }
);

ImageGenerator.displayName = "ImageGenerator";