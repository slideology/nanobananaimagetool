import type { SeedanceDuration, SeedanceResolution, VideoModel } from "./types";
import {
    HAPPYHORSE_ASPECT_RATIOS,
    HAPPYHORSE_DURATIONS,
    HAPPYHORSE_RESOLUTIONS,
    ceilToCreditsStep,
} from "~/constants";

export const DEFAULT_VIDEO_MODEL: VideoModel = "doubao-seedance-2.0";

export const VIDEO_MODEL_OPTIONS: Array<{
    id: VideoModel;
    name: string;
    description: string;
}> = [
        {
            id: "doubao-seedance-2.0",
            name: "Seedance 2.0",
            description: "Standard | Highest Quality",
        },
        {
            id: "doubao-seedance-2.0-fast",
            name: "Seedance 2.0 Fast",
            description: "Faster Generation",
        },
        {
            id: "doubao-seedance-2.0-face",
            name: "Seedance 2.0 Face",
            description: "For Verified Real Avatar Assets",
        },
        {
            id: "doubao-seedance-2.0-fast-face",
            name: "Seedance 2.0 Fast Face",
            description: "Fast Real Avatar Generation",
        },
        {
            id: "seedance-1.5-pro",
            name: "Seedance 1.5 Pro",
            description: "Legacy Kie Provider",
        },
        {
            id: "happyhorse-1.0",
            name: "HappyHorse 1.0",
            description: "Text, image reference, and video edit",
        },
    ];

export const isKieVideoModel = (model: VideoModel) => model === "seedance-1.5-pro";
export const isHappyHorseVideoModel = (model: VideoModel) => model === "happyhorse-1.0";

export const isFastSeedance2Model = (model: VideoModel) =>
    model === "doubao-seedance-2.0-fast" ||
    model === "doubao-seedance-2.0-fast-face";

export const supportsVideoResolution = (
    model: VideoModel,
    resolution: SeedanceResolution
) => {
    if (isHappyHorseVideoModel(model)) {
        return HAPPYHORSE_RESOLUTIONS.includes(resolution as any);
    }
    return resolution !== "1080p" || !isFastSeedance2Model(model);
};

export const getVideoPromptMaxLength = (model: VideoModel) =>
    isKieVideoModel(model) || isHappyHorseVideoModel(model) ? 2500 : 4000;

export const getMaxReferenceImages = (model: VideoModel) =>
    isKieVideoModel(model) ? 2 : 9;

export const getVideoAspectRatioOptions = (model: VideoModel) =>
    isHappyHorseVideoModel(model)
        ? HAPPYHORSE_ASPECT_RATIOS.map((value) => ({ value, label: value }))
        : (["1:1", "16:9", "9:16", "4:3", "3:4", "21:9"] as const).map(
            (value) => ({ value, label: value })
        );

export const supportsVideoAspectRatio = (
    model: VideoModel,
    aspectRatio: string
) => getVideoAspectRatioOptions(model).some((option) => option.value === aspectRatio);

export const supportsVideoDuration = (
    model: VideoModel,
    duration: string
) => getVideoDurationOptions(model).some((option) => option.value === duration);

export const getVideoResolutionOptions = (model: VideoModel) =>
    isHappyHorseVideoModel(model)
        ? HAPPYHORSE_RESOLUTIONS.map((value) => ({ value, label: value }))
        : (["480p", "720p", "1080p"] as const).map((value) => ({
            value,
            label: value,
            disabled: !supportsVideoResolution(model, value),
        }));

export const getVideoDurationOptions = (model: VideoModel) =>
    isHappyHorseVideoModel(model)
        ? HAPPYHORSE_DURATIONS.map((value) => ({ value, label: `${value}s` }))
        : (["4", "8", "12"] as const).map((value) => ({ value, label: `${value}s` }));

export const calculateVideoTaskCredits = ({
    model,
    resolution,
    duration,
    generateAudio,
}: {
    model: VideoModel;
    resolution: SeedanceResolution;
    duration: SeedanceDuration;
    generateAudio: boolean;
}) => {
    if (isHappyHorseVideoModel(model)) {
        const seedance2CreditsPerSecond: Record<SeedanceResolution, number> = {
            "480p": 22.5,
            "720p": 45,
            "1080p": 67.5,
        };
        return ceilToCreditsStep(
            seedance2CreditsPerSecond[resolution] *
            (0.23 / 0.07256) *
            Number(duration)
        );
    }

    const baseCredits: Record<SeedanceResolution, number> = {
        "480p": 60,
        "720p": 120,
        "1080p": 180,
    };

    const durationMultiplier: Record<string, number> = {
        "4": 1.0,
        "8": 2.0,
        "12": 3.0,
    };

    const audioMultiplier = generateAudio ? 2.0 : 1.0;
    const modelMultiplier = isKieVideoModel(model) ? 1.0 : 1.5;

    return baseCredits[resolution] *
        (durationMultiplier[duration] ?? 1.0) *
        audioMultiplier *
        modelMultiplier;
};
