import type { Route } from "./+types/route";

import { useRef, Fragment, useMemo, useState, useCallback } from "react";
import { useUser } from "~/store";

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
    { title: "Nano Banana AI Image Generator: Create Amazing Art with AI" },
    {
      name: "description",
      content:
        "Transform your images with AI-powered editing. Upload a photo and create stunning artwork with our advanced image generation tools. Try image-to-image and text-to-image modes.",
    },
    canonical,
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { imageStyles, promptCategories, styleTypes, product: CREDITS_PRODUCT };
}

export default function Home({
  loaderData: { imageStyles, promptCategories, styleTypes, product },
}: Route.ComponentProps) {
  const [requestPayment, setRequestPayment] = useState(false);
  const user = useUser((state) => state.user);

  const openRef = useRef(() => {});
  const generatorRef = useRef<ImageGeneratorRef>(null);

  const handleUpload = useCallback(() => {
    openRef.current();
    if (window) window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleBuyCredits = useCallback(async () => {
    if (!window) return;
    setRequestPayment(true);

    const res = await fetch("/api/create-order", {
      method: "POST",
      body: JSON.stringify(product),
    }).finally(() => setRequestPayment(false));

    if (res.ok) {
      const data = await res.json<{ checkout_url: string }>();
      location.href = data.checkout_url;

      return;
    }

    if (res.status === 401) {
      document.querySelector<HTMLButtonElement>("#google-oauth-btn")?.click();
    }
  }, [user]);

  const pageData = useMemo<LandingProps>(() => {
    return {
      hero: {
        title: "Create Amazing Art \nwith AI-Powered Generation",
        description:
          "Transform your images or bring your ideas to life with AI. Upload a photo for image-to-image transformation or describe your vision for text-to-image creation. Unleash your creativity in minutes!",
        buttonText: "Start Creating Now",
        dropHintText: "or drop a file here",
        exampleHintText: "Or try with example",
        secondaryDescription:
          "Creating stunning artwork just got easier. Whether you want to transform existing images or generate completely new art from text descriptions, our AI-powered tools help you bring your creative vision to life.",
        testimonialText:
          "Thousands who've already created amazing art with Nano Banana AI. Start your creative journey today.",
        diffImages: [
          "https://cdn.nanobananai.com/assets/images/diff-before.webp",
          "https://cdn.nanobananai.com/assets/images/diff-after.webp",
        ],
        exampleImages: [
          "https://cdn.nanobananai.com/assets/images/example-art-1.webp",
          "https://cdn.nanobananai.com/assets/images/example-art-2.webp",
          "https://cdn.nanobananai.com/assets/images/example-art-3.webp",
          "https://cdn.nanobananai.com/assets/images/example-art-4.webp",
        ],
        testimonialAvatars: [
          "https://cdn.nanobananai.com/assets/images/testimonial-1.webp",
          "https://cdn.nanobananai.com/assets/images/testimonial-2.webp",
          "https://cdn.nanobananai.com/assets/images/testimonial-3.webp",
          "https://cdn.nanobananai.com/assets/images/testimonial-4.webp",
          "https://cdn.nanobananai.com/assets/images/testimonial-5.webp",
        ],
      },
      howItWorks: {
        title: "How It Works",
        subtitle:
          "Create stunning AI-generated artwork in minutes with just a photo or text description",
        cover: "https://cdn.nanobananai.com/assets/images/how-it-works.webp",
        steps: [
          {
            title: "Choose your mode",
            description:
              "Select between Image-to-Image transformation or Text-to-Image generation based on your creative needs.",
          },
          {
            title: "Upload or describe",
            description:
              "Upload a photo for transformation or write a detailed prompt describing your vision for original artwork creation.",
          },
          {
            title: "Select your style",
            description:
              "Choose from various artistic styles like photorealistic, digital art, oil painting, or abstract to match your aesthetic preference.",
          },
          {
            title: "Generate amazing art",
            description:
              "Watch as our AI transforms your input into stunning artwork. Download, share, or use your creations however you like!",
          },
        ],
      },

      features: {
        title: "Why Choose Nano Banana AI Image Generator",
        subtitle:
          "Experience the most advanced AI image generation with instant access, multiple modes, and professional-quality results.",
        features: [
          {
            icon: <BookImage size={32} />,
            title: "Multiple Generation Modes",
            description:
              "Choose between Image-to-Image transformation and Text-to-Image generation. Upload photos for style transfer or create entirely new artwork from descriptions.",
          },
          {
            icon: <Globe size={32} />,
            title: "Instant Access, Anywhere",
            description:
              "Use our AI image generator right in your browser—no app required. It's fully mobile-friendly, so you can create art anytime, anywhere.",
          },
          {
            icon: <GalleryHorizontalEnd size={32} />,
            title: "50,000+ Images Generated",
            description:
              "Our AI has already powered over 50,000 image generations, helping thousands of artists and creators bring their visions to life.",
          },
          {
            icon: <Bot size={32} />,
            title: "Advanced AI Technology",
            description:
              "Powered by cutting-edge AI models that deliver stunning, high-resolution results with incredible detail and artistic quality.",
          },
          {
            icon: <ShieldUser size={32} />,
            title: "Privacy Protected",
            description:
              "Your images and prompts are processed securely and never stored or shared. Your creative privacy is our top priority.",
          },
          {
            icon: <BadgeDollarSign size={32} />,
            title: "Money-Back Guarantee",
            description:
              "If you're not satisfied with your AI-generated artwork, we offer a full refund—no questions asked.",
          },
        ],
      },

      pricing: {
        title: "Start Creating AI Art Today",
        subtitle:
          "Generate stunning artwork with AI using images or text prompts. Start with free trial credits or buy more, no subscription required",
        plans: [
          {
            title: "Try AI Art Generation for Free",
            badge: "Free Trial",
            badgeColor: "primary",
            description:
              "Upload your photo or describe your vision and instantly see AI-generated artwork. New users get 3 free credits, no credit card needed.",
            buttonText: "Start Creating – Try It Free",
            footerText: "Includes 3 free credits for new users",
            onButtonClick: handleUpload,
          },
          {
            title: "Unlock More AI Art Generations",
            badge: "Buy Credits",
            badgeColor: "secondary",
            description:
              "Want to explore more creative possibilities? Purchase credits to generate unlimited AI artwork from your photos and ideas.",
            buttonText: `Buy Credits – $${product.price} for ${product.credits} Credits`,
            footerText: "More contact support@nanobananai.com",
            loading: requestPayment,
            onButtonClick: handleBuyCredits,
          },
        ],
      },

      alternatingContent: {
        contentBlocks: [
          {
            title: "Transform Photos into Art Instantly",
            description:
              "Turn any ordinary photo into extraordinary artwork with our Image-to-Image AI technology. Upload a selfie, landscape, or any image and watch as AI transforms it into stunning digital art, paintings, or abstract masterpieces.",
            cover: "https://cdn.nanobananai.com/assets/images/content-1.webp",
          },
          {
            title: "Create Original Art from Text",
            description:
              "Bring your imagination to life with Text-to-Image generation. Simply describe your vision in words and our AI will create unique, high-quality artwork that matches your description perfectly.",
            cover: "https://cdn.nanobananai.com/assets/images/content-2.webp",
          },
          {
            title: "Professional Quality Results",
            description:
              "Get gallery-worthy artwork every time. Our advanced AI ensures professional-level quality with stunning details, vibrant colors, and artistic coherence that rivals human artists.",
            cover: "https://cdn.nanobananai.com/assets/images/content-3.webp",
          },
          {
            title: "Multiple Artistic Styles",
            description:
              "Explore endless creative possibilities with our diverse style collection. From photorealistic renders to abstract art, oil paintings to digital illustrations—find the perfect style for your vision.",
            cover: "https://cdn.nanobananai.com/assets/images/content-4.webp",
          },
          {
            title: "Perfect for Every Creator",
            description:
              "Whether you're a professional artist, designer, content creator, or hobbyist, our AI image generator adapts to your needs. Create social media content, artwork, concept designs, and more.",
            cover: "https://cdn.nanobananai.com/assets/images/content-5.webp",
          },
          {
            title: "Commercial Use Rights",
            description:
              "Use your AI-generated artwork for commercial projects, presentations, marketing materials, and more. All generated images come with full usage rights for your creative and business needs.",
            cover: "https://cdn.nanobananai.com/assets/images/content-6.webp",
          },
        ],
      },
      cta: {
        title: "Start Creating Amazing Art",
        subtitle: "with AI-Powered Image Generation",
        userCount: "25,000+",
        buttonText: "Create Now",
        testimonialAvatars: [
          "https://cdn.nanobananai.com/assets/images/testimonial-1.webp",
          "https://cdn.nanobananai.com/assets/images/testimonial-2.webp",
          "https://cdn.nanobananai.com/assets/images/testimonial-3.webp",
          "https://cdn.nanobananai.com/assets/images/testimonial-4.webp",
          "https://cdn.nanobananai.com/assets/images/testimonial-5.webp",
        ],
      },
      testimonials: {
        title: "What Our Users Are Creating",
        subtitle:
          "See what artists and creators are saying about Nano Banana AI and the amazing artwork they've generated!",
        testimonials: [
          {
            name: "Sarah Chen",
            content:
              "This AI image generator is incredible! I uploaded a simple sketch and it transformed it into a stunning digital painting. The quality is professional-level and the results exceeded my expectations.",
            avatar:
              "https://cdn.nanobananai.com/assets/images/testimonial-woman-1.webp",
          },
          {
            name: "Marcus Rodriguez",
            content:
              "As a graphic designer, I use this tool daily for concept art and client presentations. The text-to-image feature is mind-blowing - I just describe what I need and get perfect results every time.",
            avatar:
              "https://cdn.nanobananai.com/assets/images/testimonial-man-1.webp",
          },
          {
            name: "Emily Watson",
            content:
              "I've never been artistic, but with Nano Banana AI, I'm creating beautiful artwork for my social media and blog. The interface is so easy to use and the results are always amazing!",
            avatar:
              "https://cdn.nanobananai.com/assets/images/testimonial-woman-2.webp",
          },
          {
            name: "David Kim",
            content:
              "This is the future of digital art! I've generated over 100 images for my game development project. The consistency and quality are unmatched. Highly recommend for any creative professional.",
            avatar:
              "https://cdn.nanobananai.com/assets/images/testimonial-man-2.webp",
          },
        ],
      },

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
              "Each generation uses 1 credit. New users get 3 free credits to start. You can purchase additional credits anytime - we offer packages starting at $9 for 100 credits with no subscription required.",
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
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Panel - Controls */}
                <div className="lg:w-1/2 space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-6">AI Image Generator</h3>
                  </div>
                  
                  <ImageGenerator
                    styles={imageStyles}
                    promptCategories={promptCategories}
                    inline={true}
                  />
                </div>

                {/* Right Panel - Output Gallery */}
                <div className="lg:w-1/2 bg-gray-50 rounded-xl p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">🎨 Output Gallery</h3>
                    <p className="text-gray-600 text-sm">Your ultra-fast AI creations appear here instantly</p>
                    <div className="w-full h-px bg-gray-200 mt-4"></div>
                  </div>

                  <div className="h-96 bg-white rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">Ready for instant generation</h4>
                      <p className="text-sm text-gray-500">Enter your prompt and unleash the power</p>
                    </div>
                  </div>

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
                          <p className="text-xs text-gray-600">Maintain perfect character details across edits</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        </div>
                        <div>
                          <h5 className="font-medium text-sm">One-Shot Editing</h5>
                          <p className="text-xs text-gray-600">Perfect results in a single attempt</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Sections */}
      <Landing
        {...pageData}
        openRef={openRef}
        onCTAClick={handleUpload}
        onFileUpload={(photo) => generatorRef.current?.open(photo)}
        hideHero={true}
      />
    </Fragment>
  );
}
