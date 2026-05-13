import type { SeedanceDuration, SeedanceResolution, VideoModel } from "./types";

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
    ];

export const isKieVideoModel = (model: VideoModel) => model === "seedance-1.5-pro";

export const isFastSeedance2Model = (model: VideoModel) =>
    model === "doubao-seedance-2.0-fast" ||
    model === "doubao-seedance-2.0-fast-face";

export const supportsVideoResolution = (
    model: VideoModel,
    resolution: SeedanceResolution
) => resolution !== "1080p" || !isFastSeedance2Model(model);

export const getVideoPromptMaxLength = (model: VideoModel) =>
    isKieVideoModel(model) ? 2500 : 4000;

export const getMaxReferenceImages = (model: VideoModel) =>
    isKieVideoModel(model) ? 2 : 9;

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
    const baseCredits: Record<SeedanceResolution, number> = {
        "480p": 60,
        "720p": 120,
        "1080p": 180,
    };

    const durationMultiplier: Record<SeedanceDuration, number> = {
        "4": 1.0,
        "8": 2.0,
        "12": 3.0,
    };

    const audioMultiplier = generateAudio ? 2.0 : 1.0;
    const modelMultiplier = isKieVideoModel(model) ? 1.0 : 1.5;

    return baseCredits[resolution] *
        durationMultiplier[duration] *
        audioMultiplier *
        modelMultiplier;
};
