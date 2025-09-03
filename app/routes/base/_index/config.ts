import { type ImageStyle, type PromptCategory } from "~/features/image_generator/types";

export const imageStyles: ImageStyle[] = [
  {
    name: "Photorealistic",
    value: "photorealistic",
    cover: "https://cdn.nanobananaimageqoder.app/styles/photorealistic.webp",
    type: "photography",
    description: "Ultra-realistic photography style"
  },
  {
    name: "Digital Art",
    value: "digital-art",
    cover: "https://cdn.nanobananaimageqoder.app/styles/digital-art.webp",
    type: "art",
    description: "Modern digital artwork style"
  },
  {
    name: "Oil Painting",
    value: "oil-painting",
    cover: "https://cdn.nanobananaimageqoder.app/styles/oil-painting.webp",
    type: "art",
    description: "Classic oil painting technique"
  },
  {
    name: "Watercolor",
    value: "watercolor",
    cover: "https://cdn.nanobananaimageqoder.app/styles/watercolor.webp",
    type: "art",
    description: "Soft watercolor painting style"
  },
  {
    name: "Anime",
    value: "anime",
    cover: "https://cdn.nanobananaimageqoder.app/styles/anime.webp",
    type: "illustration",
    description: "Japanese anime art style"
  },
  {
    name: "Cartoon",
    value: "cartoon",
    cover: "https://cdn.nanobananaimageqoder.app/styles/cartoon.webp",
    type: "illustration",
    description: "Fun cartoon illustration style"
  },
  {
    name: "Cyberpunk",
    value: "cyberpunk",
    cover: "https://cdn.nanobananaimageqoder.app/styles/cyberpunk.webp",
    type: "fantasy",
    description: "Futuristic cyberpunk aesthetic"
  },
  {
    name: "Fantasy",
    value: "fantasy",
    cover: "https://cdn.nanobananaimageqoder.app/styles/fantasy.webp",
    type: "fantasy",
    description: "Magical fantasy world style"
  },
  {
    name: "Sketch",
    value: "sketch",
    cover: "https://cdn.nanobananaimageqoder.app/styles/sketch.webp",
    type: "art",
    description: "Hand-drawn sketch style"
  },
  {
    name: "Pop Art",
    value: "pop-art",
    cover: "https://cdn.nanobananaimageqoder.app/styles/pop-art.webp",
    type: "art",
    description: "Bold pop art style"
  }
];

export const promptCategories: PromptCategory[] = [
  {
    name: "Portrait",
    value: "portrait",
    prompts: [
      "beautiful portrait",
      "professional headshot",
      "artistic portrait",
      "dramatic lighting portrait"
    ]
  },
  {
    name: "Landscape",
    value: "landscape",
    prompts: [
      "stunning landscape",
      "mountain scenery",
      "ocean view",
      "forest pathway"
    ]
  },
  {
    name: "Abstract",
    value: "abstract",
    prompts: [
      "abstract art",
      "geometric patterns",
      "fluid dynamics",
      "color explosion"
    ]
  },
  {
    name: "Architecture",
    value: "architecture",
    prompts: [
      "modern architecture",
      "ancient building",
      "futuristic city",
      "gothic cathedral"
    ]
  }
];

export const styleTypes = [
  { label: "Photography", value: "photography" },
  { label: "Art", value: "art" },
  { label: "Illustration", value: "illustration" },
  { label: "Fantasy", value: "fantasy" },
];

