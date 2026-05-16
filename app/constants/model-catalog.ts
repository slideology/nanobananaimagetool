export type PublicModelMediaType = "image" | "video";

export type PublicModelDefaultMode =
  | "text-to-image"
  | "image-to-image"
  | "text-to-video"
  | "image-to-video"
  | "reference-image-to-video"
  | "video-edit";

export type PublicModelPricing = {
  providerPriceUsd: number;
  billingUnit: "generation" | "second";
  baseCreditModel?: string;
};

export type PublicModelFaq = {
  question: string;
  answer: string;
};

export type PublicModelCapabilities = {
  modes: PublicModelDefaultMode[];
  maxReferenceImages?: number;
  aspectRatios?: string[];
  resolutions?: string[];
  durations?: string[];
  supportsAudioToggle?: boolean;
  supportsVideoUpload?: boolean;
};

export type PublicModelCatalogItem = {
  id: string;
  slug: string;
  mediaType: PublicModelMediaType;
  provider: "apimart" | "kie";
  providerModel: string;
  displayName: string;
  shortName: string;
  description: string;
  vendor: string;
  defaultMode: PublicModelDefaultMode;
  capabilities: PublicModelCapabilities;
  pricing: PublicModelPricing;
  thumbnailUrl?: string;
  docsUrl?: string;
  aliases?: string[];
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
  faqs?: PublicModelFaq[];
};

export const GPT_IMAGE_2_ASPECT_RATIOS = [
  "auto",
  "1:1",
  "3:2",
  "2:3",
  "4:3",
  "3:4",
  "5:4",
  "4:5",
  "16:9",
  "9:16",
  "2:1",
  "1:2",
  "21:9",
  "9:21",
] as const;

export const GPT_IMAGE_2_FOUR_K_ASPECT_RATIOS = [
  "16:9",
  "9:16",
  "2:1",
  "1:2",
  "21:9",
  "9:21",
] as const;

export const HAPPYHORSE_ASPECT_RATIOS = [
  "16:9",
  "9:16",
  "1:1",
  "4:3",
  "3:4",
] as const;

export const HAPPYHORSE_DURATIONS = [
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
] as const;

export const HAPPYHORSE_RESOLUTIONS = ["720p", "1080p"] as const;

export const PUBLIC_MODEL_CATALOG: PublicModelCatalogItem[] = [
  {
    id: "gpt-image-2",
    slug: "gpt-image-2",
    mediaType: "image",
    provider: "apimart",
    providerModel: "gpt-image-2",
    displayName: "GPT Image 2",
    shortName: "GPT Image 2",
    vendor: "OpenAI",
    description:
      "Next-generation text and reference image generation with strong prompt following, text rendering, and up to 4K output.",
    defaultMode: "text-to-image",
    capabilities: {
      modes: ["text-to-image", "image-to-image"],
      maxReferenceImages: 16,
      aspectRatios: [...GPT_IMAGE_2_ASPECT_RATIOS],
      resolutions: ["1K", "2K", "4K"],
    },
    pricing: {
      providerPriceUsd: 0.006,
      billingUnit: "generation",
      baseCreditModel: "nano-banana",
    },
    thumbnailUrl:
      "https://upload.apimart.ai/f/models/9998223236485340-4ea2c73a-3656-419f-87ef-4c9b29381a62-gpt-image-2.webp",
    docsUrl:
      "https://docs.apimart.ai/en/api-reference/images/gpt-image-2/generation",
    seo: {
      title: "GPT Image 2 AI Generator | Next-Gen Text-to-Image",
      description:
        "Generate photorealistic 4K visuals with OpenAI's GPT Image 2. Experience flawless text rendering, realistic UI mockups, and advanced image editing.",
      keywords:
        "GPT Image 2, AI image generator, GPT image API, text to image, image to image, 4K AI images",
    },
    faqs: [
      {
        question: "What is GPT Image 2 and what are its key features?",
        answer:
          "GPT Image 2 is OpenAI's next-generation text-to-image model. It delivers massive upgrades in visual realism, prompt comprehension, and image composition, allowing users to generate professional-grade, photorealistic graphics from simple text descriptions.",
      },
      {
        question: "Can GPT Image 2 accurately render text inside generated images?",
        answer:
          "Yes, this is one of its most powerful upgrades. GPT Image 2 has completely solved the \"gibberish text\" issue common in older AI models. It offers flawless text rendering, making it incredibly easy to design realistic posters, logos, and UI/UX mockups with legible, coherent typography.",
      },
      {
        question: "What resolution does GPT Image 2 support, and who is it for?",
        answer:
          "GPT Image 2 natively supports ultra-high-definition 4K resolution output with intricate details in lighting, textures, and human anatomy. It is an ideal tool for web designers, digital marketers, concept artists, and product managers who require production-ready visual assets.",
      },
    ],
  },
  {
    id: "happyhorse-1.0",
    slug: "happyhorse-1-0",
    mediaType: "video",
    provider: "apimart",
    providerModel: "happyhorse-1.0",
    displayName: "HappyHorse 1.0",
    shortName: "HappyHorse",
    vendor: "Alibaba",
    description:
      "Unified multimodal video generation for text-to-video, image-to-video, reference-image-to-video, and video editing.",
    defaultMode: "text-to-video",
    capabilities: {
      modes: [
        "text-to-video",
        "image-to-video",
        "reference-image-to-video",
        "video-edit",
      ],
      maxReferenceImages: 9,
      aspectRatios: [...HAPPYHORSE_ASPECT_RATIOS],
      resolutions: [...HAPPYHORSE_RESOLUTIONS],
      durations: [...HAPPYHORSE_DURATIONS],
      supportsAudioToggle: false,
      supportsVideoUpload: true,
    },
    pricing: {
      providerPriceUsd: 0.23,
      billingUnit: "second",
      baseCreditModel: "doubao-seedance-2.0",
    },
    thumbnailUrl:
      "https://upload.apimart.ai/f/models/9998222701159036-628cb72a-47ba-49d1-83c4-c74babeb56bd-happyhorse-1.0.webm",
    docsUrl:
      "https://docs.apimart.ai/en/api-reference/videos/happyhorse-1.0/generation",
    seo: {
      title: "Happy Horse 1.0 AI Video Generator | Text-to-Video",
      description:
        "Experience Happy Horse 1.0, the top-ranked AI video generator. Convert text and images into high-quality, cinematic 1080p videos with unified audio.",
      keywords:
        "HappyHorse 1.0, AI video generator, text to video, image to video, video edit, Alibaba video model",
    },
    faqs: [
      {
        question: "What is Happy Horse 1.0 and how does it work?",
        answer:
          "Happy Horse 1.0 is a top-tier AI video generation model designed to convert text prompts and static images into cinematic-quality videos. Powered by an advanced single-stream self-attention Transformer architecture, it delivers exceptional visual stability, realistic physics, and stunning 1080p resolution.",
      },
      {
        question: "What makes Happy Horse 1.0 different from other AI video tools?",
        answer:
          "The biggest breakthrough of Happy Horse 1.0 is its native unified audio-video generation. Instead of generating video first and adding sound later, it creates perfectly synchronized audio effects and background music simultaneously with the visuals, ensuring a seamless and immersive viewing experience.",
      },
      {
        question: "Does Happy Horse 1.0 support lip-syncing and multi-camera control?",
        answer:
          "Yes. Happy Horse 1.0 excels at multi-shot continuity and supports multi-language lip-syncing (Lip Sync). It allows creators to maintain consistent characters across different scenes and control camera movements with professional-grade precision.",
      },
    ],
  },
  {
    id: "nano-banana-2",
    slug: "nano-banana-2",
    mediaType: "image",
    provider: "apimart",
    providerModel: "gemini-3.1-flash-image-preview",
    displayName: "Nano Banana 2",
    shortName: "Nano Banana 2",
    vendor: "Google",
    description: "Existing advanced image model used by the main generator.",
    defaultMode: "text-to-image",
    capabilities: {
      modes: ["text-to-image", "image-to-image"],
      maxReferenceImages: 14,
      resolutions: ["1K", "2K", "4K"],
    },
    pricing: {
      providerPriceUsd: 0.03,
      billingUnit: "generation",
    },
    aliases: ["nano-banana-2"],
    seo: {
      title: "Nano Banana 2 AI Image Generator",
      description:
        "Generate and edit AI images with Nano Banana 2 and high-resolution multi-image workflows.",
      keywords:
        "Nano Banana 2, Gemini image, AI image generator, image to image",
    },
  },
  {
    id: "seedance-2-0",
    slug: "seedance-2-0",
    mediaType: "video",
    provider: "apimart",
    providerModel: "doubao-seedance-2.0",
    displayName: "Seedance 2.0",
    shortName: "Seedance 2.0",
    vendor: "ByteDance",
    description: "Existing ApiMart Seedance 2.0 video model family.",
    defaultMode: "text-to-video",
    capabilities: {
      modes: ["text-to-video", "image-to-video"],
      maxReferenceImages: 9,
      aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
      resolutions: ["480p", "720p", "1080p"],
      durations: ["4", "8", "12"],
      supportsAudioToggle: true,
    },
    pricing: {
      providerPriceUsd: 0.07256,
      billingUnit: "second",
    },
    aliases: [
      "doubao-seedance-2.0",
      "doubao-seedance-2.0-fast",
      "doubao-seedance-2.0-face",
      "doubao-seedance-2.0-fast-face",
    ],
    seo: {
      title: "Seedance 2.0 AI Video Generator",
      description:
        "Create AI videos with Seedance 2.0 using text prompts, reference images, and native audio options.",
      keywords:
        "Seedance 2.0, AI video generator, text to video, image to video",
    },
  },
];

export const PUBLIC_MODEL_PAGE_ITEMS = PUBLIC_MODEL_CATALOG.filter(
  (model) => model.id === "gpt-image-2" || model.id === "happyhorse-1.0"
);

export const getPublicModelBySlug = (slug: string) =>
  PUBLIC_MODEL_CATALOG.find((model) => model.slug === slug);

export const getPublicModelById = (id: string) =>
  PUBLIC_MODEL_CATALOG.find(
    (model) => model.id === id || model.aliases?.includes(id)
  );

export const ceilToCreditsStep = (value: number, step = 5) =>
  Math.ceil(value / step) * step;
