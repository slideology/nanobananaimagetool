import type { Route } from "./+types/route";

import { useRef, Fragment, useMemo, useState, useCallback } from "react";
import { useUser } from "~/store";
import { useErrorHandler } from "~/hooks/use-error-handler";

import {
  BookImage,
  Globe,
  GalleryHorizontalEnd,
  Bot,
  ShieldUser,
  BadgeDollarSign,
} from "lucide-react";

import Landing, { type LandingProps } from "~/components/pages/landing";
import {
  ImageGenerator,
  type ImageGeneratorRef,
} from "~/features/image_generator";

import { createCanonical } from "~/utils/meta";
import { imageStyles, promptCategories, styleTypes } from "./config";
import { CREDITS_PRODUCT } from "~/.server/constants";

export function meta({ matches }: Route.MetaArgs) {
  const canonical = createCanonical("/", matches[0].data.DOMAIN);

  return [
    { title: "Nano Banana | AI-Powered Photo Editor - Edit with Text Prompts" },
    {
      name: "description",
      content:
        "Edit any photo with simple words using our advanced AI. Nano Banana delivers consistent results, superior to Flux Kontext. Transform your images effortlessly with the power of natural language.",
    },
    canonical,
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { 
    imageStyles, 
    promptCategories, 
    styleTypes, 
    product: CREDITS_PRODUCT,
    THIRD_PARTY_ADS_ID: context.cloudflare.env.THIRD_PARTY_ADS_ID 
  };
}

export default function Home({
  loaderData: { imageStyles, promptCategories, styleTypes, product, THIRD_PARTY_ADS_ID },
}: Route.ComponentProps) {
  const [requestPayment, setRequestPayment] = useState(false);
  const user = useUser((state) => state.user);

  // 错误处理钩子
  const { handleError } = useErrorHandler({
    showToast: true,
    onError: (errorInfo) => {
      console.error('Home Page Error:', {
        component: 'Home',
        title: errorInfo.title,
        message: errorInfo.message,
        code: errorInfo.code,
        severity: errorInfo.severity,
        timestamp: new Date().toISOString()
      });
    }
  });

  const openRef = useRef(() => {});
  const generatorRef = useRef<ImageGeneratorRef>(null);

  const handleUpload = useCallback(() => {
    openRef.current();
    if (window) window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleBuyCredits = useCallback(async () => {
    if (!window) return;
    setRequestPayment(true);

    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        body: JSON.stringify(product),
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

      const data = await res.json<{ checkout_url: string }>();
      location.href = data.checkout_url;
    } catch (error) {
      console.error('创建订单失败:', error);
      handleError(error);
      
      // 如果是401错误，触发登录
      if ((error as any)?.status === 401) {
        document.querySelector<HTMLButtonElement>("#google-oauth-btn")?.click();
      }
    } finally {
      setRequestPayment(false);
    }
  }, [user, handleError, product]);

  const pageData = useMemo<LandingProps>(() => {
    return {

      howItWorks: {
        title: "How It Works",
        subtitle:
          "Edit any photo in minutes with simple text commands - no complex tools required",
        cover: "https://cdn.nanobananai.com/assets/images/how-it-works.webp",
        steps: [
          {
            title: "Upload your photo",
            description:
              "Simply drag and drop or select any photo you want to edit. Nano Banana supports all common image formats.",
          },
          {
            title: "Describe your changes",
            description:
              "Tell us what you want to change in plain English. For example: 'make the sky more dramatic' or 'change hair color to blonde'.",
          },
          {
            title: "AI processes instantly",
            description:
              "Our advanced AI understands your request and applies the changes with precision, delivering consistent results every time.",
          },
          {
            title: "Download your result",
            description:
              "Get your edited photo in high quality. Share it instantly or make additional edits with more text commands!",
          },
        ],
      },

      features: {
        title: "Why Choose Nano Banana AI Photo Editor",
        subtitle:
          "Experience the most intuitive photo editing with natural language commands, instant results, and professional-quality output.",
        features: [
          {
            icon: <BookImage size={32} />,
            title: "Natural Language Editing",
            description:
              "Edit photos using simple text commands. No need to learn complex tools - just describe what you want and our AI does the rest.",
          },
          {
            icon: <Globe size={32} />,
            title: "Instant Access, Anywhere",
            description:
              "Use Nano Banana right in your browser—no app required. It's fully mobile-friendly, so you can edit photos anytime, anywhere.",
          },
          {
            icon: <GalleryHorizontalEnd size={32} />,
            title: "50,000+ Photos Edited",
            description:
              "Nano Banana has successfully edited over 50,000 photos, helping thousands of users transform their images effortlessly.",
          },
          {
            icon: <Bot size={32} />,
            title: "Superior AI Technology",
            description:
              "Powered by advanced AI models that deliver consistent, high-quality results - superior to Flux Kontext and other alternatives.",
          },
          {
            icon: <ShieldUser size={32} />,
            title: "Privacy Protected",
            description:
              "Your photos and editing requests are processed securely and never stored or shared. Your privacy is our top priority.",
          },
          {
            icon: <BadgeDollarSign size={32} />,
            title: "Money-Back Guarantee",
            description:
              "If you're not satisfied with your photo editing results, we offer a full refund—no questions asked.",
          },
        ],
      },

      pricing: {
        title: "Start Editing Photos Today",
        subtitle:
          "Edit any photo with simple text commands. Start with free trial credits or buy more, no subscription required",
        plans: [
          {
            title: "Try Photo Editing for Free",
            badge: "Free Trial",
            badgeColor: "primary",
            description:
              "Upload your photo and describe your edits in plain English. New users get 3 free credits, no credit card needed.",
            buttonText: "Start Editing – Try It Free",
            footerText: "Includes 1 free credits for new users",
            onButtonClick: handleUpload,
          },
          {
            title: "Unlock More Photo Edits",
            badge: "Buy Credits",
            badgeColor: "secondary",
            description:
              "Want to edit more photos? Purchase credits to unlock unlimited photo editing capabilities with our advanced AI technology.",
            buttonText: `Buy Credits – $${product.price} for ${product.credits} Credits`,
            footerText: "More contact support@nanobananaimage.org",
            loading: requestPayment,
            onButtonClick: handleBuyCredits,
          },
        ],
      },

      alternatingContent: {
        contentBlocks: [
          {
            title: "Edit Photos with Natural Language",
            description:
              "Transform any photo using simple text commands. Just describe what you want to change - 'make the sky more dramatic', 'change hair color', or 'remove background' - and watch Nano Banana work its magic instantly.",
            cover: "/assets/nano-banana-new-image-model-examples-v0-0uypne6v8uif1.webp",
          },
          {
            title: "Consistent, Superior Results",
            description:
              "Unlike other AI photo editors, Nano Banana delivers consistent, high-quality results every time. Our advanced technology outperforms Flux Kontext and other alternatives with reliable, professional-grade edits.",
            cover: "/assets/nano-banana-new-image-model-examples-v0-c8b9mo2b7uif1.webp",
          },
          {
            title: "No Complex Tools Required",
            description:
              "Forget complicated photo editing software. Nano Banana makes professional photo editing accessible to everyone - no learning curve, no technical skills needed, just simple text commands.",
            cover: "/assets/nano-banana-new-image-model-examples-v0-df0pa95b8uif1.webp",
          },
          {
            title: "Lightning Fast Processing",
            description:
              "Get your edited photos in seconds, not minutes. Our optimized AI processes your requests instantly, so you can iterate quickly and achieve the perfect result without waiting.",
            cover: "/assets/nano-banana-new-image-model-examples-v0-f6benr39auif1.webp",
          },
          {
            title: "Perfect for Everyone",
            description:
              "Whether you're a social media influencer, photographer, marketer, or just someone who loves great photos, Nano Banana adapts to your needs. Edit portraits, landscapes, products, and more.",
            cover: "/assets/nano-banana-new-image-model-examples-v0-gioq3ao79uif1.webp",
          },
          {
            title: "Full Commercial Rights",
            description:
              "Use your edited photos for any purpose - commercial projects, social media, marketing materials, and more. All edited images come with full usage rights for your personal and business needs.",
            cover: "/assets/nano-banana-new-image-model-examples-v0-o7dv8xyx9uif1.webp",
          },
        ],
      },
      // CTA 模块数据 - 已注释掉
      /* cta: {
        title: "Start Editing Photos Today",
        subtitle: "with Natural Language Commands",
        buttonText: "Edit Photos Now",
        testimonialAvatars: [
          "/assets/72*72-1.png",
          "/assets/72*72-2.png",
          "/assets/72*72-3.png",
          "/assets/72*72-4.png",
          "/assets/72*72-1.png",
        ],
      }, */
      // Testimonials 模块数据 - 已注释掉
      /* testimonials: {
        title: "What Our Users Are Saying",
        subtitle:
          "See what photographers and creators are saying about Nano Banana and the amazing photo edits they've achieved!",
        testimonials: [
          {
            name: "Sarah Chen",
            content:
              "This AI image generator is incredible! I uploaded a simple sketch and it transformed it into a stunning digital painting. The quality is professional-level and the results exceeded my expectations.",
            avatar:
              "/assets/640*640-1.png",
          },
          {
            name: "Marcus Rodriguez",
            content:
              "As a graphic designer, I use this tool daily for concept art and client presentations. The text-to-image feature is mind-blowing - I just describe what I need and get perfect results every time.",
            avatar:
              "/assets/640*640-2.png",
          },
          {
            name: "Emily Watson",
            content:
              "I've never been artistic, but with Nano Banana AI, I'm creating beautiful artwork for my social media and blog. The interface is so easy to use and the results are always amazing!",
            avatar:
              "/assets/640*640-3.png",
          },
          {
            name: "David Kim",
            content:
              "This is the future of digital art! I've generated over 100 images for my game development project. The consistency and quality are unmatched. Highly recommend for any creative professional.",
            avatar:
              "/assets/640*640-4.png",
          },
        ],
      }, */

      faqs: {
        title: "Frequently Asked Questions",
        subtitle:
          "Get answers to common questions about our AI image generation service and discover how to create the best artwork",
        faqs: [
          {
            question: "How does AI image generation work?",
            answer:
              "Our AI analyzes your input (image or text) and uses advanced machine learning to generate new artwork. For Image-to-Image, it transforms your photo while preserving key elements. For Text-to-Image, it creates original artwork based on your description.",
          },
          {
            question: "What's the difference between Image-to-Image and Text-to-Image?",
            answer:
              "Image-to-Image transforms existing photos into different artistic styles while maintaining the original composition. Text-to-Image creates entirely new artwork from your written description without requiring an input image.",
          },
          {
            question: "Can I use the generated images commercially?",
            answer:
              "Yes! All images generated with Nano Banana AI come with full commercial usage rights. You can use them for business projects, marketing materials, products, and any commercial purpose.",
          },
          {
            question: "What image formats are supported?",
            answer:
              "We support JPG, PNG, and WebP formats for uploads. Generated images are provided in high-quality PNG format with transparent backgrounds available for certain styles.",
          },
          {
            question: "How many images can I generate?",
            answer:
              "Each generation uses 1 credit. New users get 1 free credits to start. You can purchase additional credits anytime - we offer packages starting at $9.9 for 100 credits with no subscription required.",
          },
          {
            question: "Are my images and prompts private?",
            answer:
              "Absolutely! We prioritize your privacy. All uploads and prompts are processed securely and are not stored on our servers or shared with anyone. Your creative work remains completely private.",
          },
          {
            question: "What artistic styles are available?",
            answer:
              "We offer a wide range of styles including photorealistic, digital art, oil painting, watercolor, abstract, anime, vintage, modern, and many more. New styles are added regularly based on user feedback.",
          },
          {
            question: "How long does it take to generate an image?",
            answer:
              "Most images are generated within 30-60 seconds. Complex prompts or high-detail requests may take up to 2 minutes. You'll see real-time progress updates during generation.",
          },
          {
            question: "Can I edit or refine generated images?",
            answer:
              "While our AI creates high-quality results, you can always generate variations by adjusting your prompt or trying different styles. We also provide tips for writing better prompts to get exactly what you envision.",
          },
          {
            question: "Is there a mobile app?",
            answer:
              "Our web platform is fully mobile-optimized and works perfectly on smartphones and tablets. You can create stunning AI art anywhere using just your mobile browser - no app download required.",
          },
        ],
      },
    };
  }, [product, requestPayment, handleUpload, handleBuyCredits]);

  const headings = useMemo(() => {
    return [
      {
        title: "AI Image Generator",
        subtitle: "Choose your generation mode and style",
      },
      {
        title: "Style Settings",
        subtitle: "Customize your artistic preferences",
      },
      {
        title: "Generation Preview",
        subtitle: "Review your request and start creating",
      },
    ];
  }, []);

  return (
    <Fragment>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Create Amazing Art<br />with AI-Powered Generation
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transform your images or bring your ideas to life with AI. Upload a photo for image-to-image transformation or describe your vision for text-to-image creation.
            </p>
          </div>
        </div>
      </section>

      {/* Main AI Generator Section */}
      <section className="py-16 bg-base-100">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-6">AI Image Generator</h3>
                </div>
                
                <ImageGenerator
                   ref={generatorRef}
                   styles={imageStyles}
                   promptCategories={promptCategories}
                   inline={true}
                 />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Sections */}
      <Landing
        {...pageData}
        onCTAClick={handleUpload}
        // thirdPartyAdsId={THIRD_PARTY_ADS_ID} // 临时禁用第三方广告
      />
    </Fragment>
  );
}
