export type ImageGenerationMode = "image-to-image" | "text-to-image";

export type ImageModelId =
  | "nano-banana"
  | "nano-banana-edit"
  | "nano-banana-2"
  | "nano-banana-pro";

export type ImageResolution = "1K" | "2K" | "4K";

export interface ImageAspectRatioOption {
  value: string;
  label: string;
}

export interface ImageModelOption {
  id: ImageModelId;
  name: string;
  description: string;
  credits: number;
}

export const IMAGE_MODEL_OPTIONS: Record<
  ImageGenerationMode,
  ImageModelOption[]
> = {
  "text-to-image": [
    {
      id: "nano-banana",
      name: "Nano Banana",
      description: "Fast Generation | Affordable",
      credits: 30,
    },
    {
      id: "nano-banana-2",
      name: "Nano Banana 2",
      description: "Advanced Flash Image | Multi-Image",
      credits: 50,
    },
    {
      id: "nano-banana-pro",
      name: "Nano Banana Pro",
      description: "Pro Image Quality | Multi-Image",
      credits: 50,
    },
  ],
  "image-to-image": [
    {
      id: "nano-banana-edit",
      name: "Nano Banana Edit",
      description: "Fast Editing | Affordable",
      credits: 30,
    },
    {
      id: "nano-banana-2",
      name: "Nano Banana 2",
      description: "Advanced Flash Image | Multi-Image",
      credits: 50,
    },
    {
      id: "nano-banana-pro",
      name: "Nano Banana Pro",
      description: "Pro Image Quality | Multi-Image",
      credits: 50,
    },
  ],
};

export const ADVANCED_IMAGE_MODELS: ImageModelId[] = [
  "nano-banana-2",
  "nano-banana-pro",
];

const STANDARD_ASPECT_RATIO_OPTIONS: ImageAspectRatioOption[] = [
  { value: "1:1", label: "1:1 (Square)" },
  { value: "2:3", label: "2:3" },
  { value: "3:2", label: "3:2" },
  { value: "3:4", label: "3:4" },
  { value: "4:3", label: "4:3" },
  { value: "4:5", label: "4:5" },
  { value: "5:4", label: "5:4" },
  { value: "9:16", label: "9:16 (Portrait)" },
  { value: "16:9", label: "16:9 (Landscape)" },
  { value: "21:9", label: "21:9" },
];

const NANO_BANANA_2_EXTRA_ASPECT_RATIO_OPTIONS: ImageAspectRatioOption[] = [
  { value: "1:4", label: "1:4" },
  { value: "1:8", label: "1:8" },
  { value: "4:1", label: "4:1" },
  { value: "8:1", label: "8:1" },
];

export const isAdvancedImageModel = (model: string): model is ImageModelId =>
  ADVANCED_IMAGE_MODELS.includes(model as ImageModelId);

export const getImageTaskCredits = (
  model: string,
  resolution: ImageResolution
) => {
  if (isAdvancedImageModel(model)) {
    if (resolution === "4K") return 120;
    if (resolution === "2K") return 80;
    return 50;
  }

  return 30;
};

export const getImageAspectRatioOptions = (
  model: string
): ImageAspectRatioOption[] => {
  if (model === "nano-banana-2") {
    return [
      ...STANDARD_ASPECT_RATIO_OPTIONS.slice(0, 1),
      ...NANO_BANANA_2_EXTRA_ASPECT_RATIO_OPTIONS.slice(0, 2),
      ...STANDARD_ASPECT_RATIO_OPTIONS.slice(1, 6),
      ...NANO_BANANA_2_EXTRA_ASPECT_RATIO_OPTIONS.slice(2),
      ...STANDARD_ASPECT_RATIO_OPTIONS.slice(6),
    ];
  }

  return STANDARD_ASPECT_RATIO_OPTIONS;
};
