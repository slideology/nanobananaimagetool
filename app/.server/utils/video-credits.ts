import { ceilToCreditsStep } from "~/constants";

/**
 * 视频积分计算工具
 * 新积分计算策略（2026-02-26更新）：
 * 公式：基础积分 × 时长系数 × 音频系数
 */

export interface VideoCreditsParams {
    resolution: '480p' | '720p' | '1080p';
    duration: string;
    generateAudio: boolean;
    model?: VideoCreditModel;
}

export type VideoCreditModel =
    | 'seedance-1.5-pro'
    | 'doubao-seedance-2.0'
    | 'doubao-seedance-2.0-fast'
    | 'doubao-seedance-2.0-face'
    | 'doubao-seedance-2.0-fast-face'
    | 'happyhorse-1.0';

export const API_MART_SEEDANCE_CREDIT_MULTIPLIER = 1.5;
export const HAPPYHORSE_PRICE_PER_SECOND_USD = 0.23;
export const SEEDANCE_2_PRICE_PER_SECOND_USD = 0.07256;

export const isApiMartSeedanceCreditModel = (model?: VideoCreditModel) =>
    !!model && model !== 'seedance-1.5-pro' && model !== 'happyhorse-1.0';

export const isHappyHorseCreditModel = (model?: VideoCreditModel) =>
    model === 'happyhorse-1.0';

const baseCredits: Record<VideoCreditsParams['resolution'], number> = {
    '480p': 60,
    '720p': 120,
    '1080p': 180
};

const seedance2CreditsPerSecond = (resolution: VideoCreditsParams['resolution']) =>
    (baseCredits[resolution] * API_MART_SEEDANCE_CREDIT_MULTIPLIER) / 4;

export const calculateHappyHorseCredits = (
    resolution: VideoCreditsParams['resolution'],
    duration: string
) => {
    const seconds = Number(duration);
    return ceilToCreditsStep(
        seedance2CreditsPerSecond(resolution) *
        (HAPPYHORSE_PRICE_PER_SECOND_USD / SEEDANCE_2_PRICE_PER_SECOND_USD) *
        seconds
    );
};

/**
 * 计算视频生成所需积分
 * 
 * 积分计算规则:
 * - 基础积分根据分辨率: 480p=60, 720p=120, 1080p=180
 * - 时长系数: 4s=1.0, 8s=2.0, 12s=3.0
 * - 音频系数: 不生成=1.0, 生成=2.0
 * 
 * 示例:
 * - 480p × 4s × 无音频 = 60×1.0×1.0 = 60积分
 * - 720p × 8s × 有音频 = 120×2.0×2.0 = 480积分
 * - 1080p × 12s × 有音频 = 180×3.0×2.0 = 1080积分
 */
export function calculateVideoCredits(params: VideoCreditsParams): number {
    if (isHappyHorseCreditModel(params.model)) {
        return calculateHappyHorseCredits(params.resolution, params.duration);
    }

    // 时长系数
    const durationMultiplier: Record<string, number> = {
        '4': 1.0,
        '8': 2.0,
        '12': 3.0
    };

    // 音频系数
    const audioMultiplier = params.generateAudio ? 2.0 : 1.0;
    const modelMultiplier = isApiMartSeedanceCreditModel(params.model)
        ? API_MART_SEEDANCE_CREDIT_MULTIPLIER
        : 1.0;

    // 计算总积分（整数，无需向上取整）
    const totalCredits = baseCredits[params.resolution] *
        (durationMultiplier[params.duration] ?? 1.0) *
        audioMultiplier *
        modelMultiplier;

    return totalCredits;
}

/**
 * 获取视频积分消耗的详细说明
 * 用于UI显示
 */
export function getVideoCreditsBreakdown(params: VideoCreditsParams): {
    base: number;
    durationMultiplier: number;
    audioMultiplier: number;
    modelMultiplier: number;
    total: number;
    description: string;
} {
    const durationMultiplierMap: Record<string, number> = {
        '4': 1.0,
        '8': 2.0,
        '12': 3.0
    };

    if (isHappyHorseCreditModel(params.model)) {
        const durationSeconds = Number(params.duration);
        const priceMultiplier =
            HAPPYHORSE_PRICE_PER_SECOND_USD / SEEDANCE_2_PRICE_PER_SECOND_USD;
        const basePerSecond = seedance2CreditsPerSecond(params.resolution);
        const total = calculateHappyHorseCredits(params.resolution, params.duration);

        return {
            base: basePerSecond,
            durationMultiplier: durationSeconds,
            audioMultiplier: 1,
            modelMultiplier: priceMultiplier,
            total,
            description: `${params.resolution} Seedance 2.0 ${basePerSecond} credits/s × HappyHorse ×${priceMultiplier.toFixed(2)} × ${durationSeconds}s = ${total} credits`
        };
    }

    const base = baseCredits[params.resolution];
    const durationMultiplier = durationMultiplierMap[params.duration] ?? 1.0;
    const audioMultiplier = params.generateAudio ? 2.0 : 1.0;
    const modelMultiplier = isApiMartSeedanceCreditModel(params.model)
        ? API_MART_SEEDANCE_CREDIT_MULTIPLIER
        : 1.0;
    const total = calculateVideoCredits(params);

    const parts: string[] = [];
    parts.push(`${params.resolution} (${base} credits)`);
    parts.push(`${params.duration}s ×${durationMultiplier}`);
    if (params.generateAudio) {
        parts.push(`Audio ×2`);
    }
    if (modelMultiplier !== 1) {
        parts.push(`Seedance 2.0 ×${modelMultiplier}`);
    }

    return {
        base,
        durationMultiplier,
        audioMultiplier,
        modelMultiplier,
        total,
        description: `${parts.join(' × ')} = ${total} credits`
    };
}
