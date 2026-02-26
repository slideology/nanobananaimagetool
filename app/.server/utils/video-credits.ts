/**
 * 视频积分计算工具
 * 新积分计算策略（2026-02-26更新）：
 * 公式：基础积分 × 时长系数 × 音频系数
 */

export interface VideoCreditsParams {
    resolution: '480p' | '720p' | '1080p';
    duration: '4' | '8' | '12';
    generateAudio: boolean;
}

/**
 * 计算视频生成所需积分
 * 
 * 积分计算规则:
 * - 基础积分根据分辨率: 480p=10, 720p=20, 1080p=30
 * - 时长系数: 4s=1.0, 8s=2.0, 12s=3.0
 * - 音频系数: 不生成=1.0, 生成=2.0
 * 
 * 示例:
 * - 480p × 4s × 无音频 = 10×1.0×1.0 = 10积分
 * - 720p × 8s × 有音频 = 20×2.0×2.0 = 80积分
 * - 1080p × 12s × 有音频 = 30×3.0×2.0 = 180积分
 */
export function calculateVideoCredits(params: VideoCreditsParams): number {
    // 基础积分(根据分辨率)
    const baseCredits: Record<VideoCreditsParams['resolution'], number> = {
        '480p': 60,
        '720p': 120,
        '1080p': 180
    };

    // 时长系数
    const durationMultiplier: Record<VideoCreditsParams['duration'], number> = {
        '4': 1.0,
        '8': 2.0,
        '12': 3.0
    };

    // 音频系数
    const audioMultiplier = params.generateAudio ? 2.0 : 1.0;

    // 计算总积分（整数，无需向上取整）
    const totalCredits = baseCredits[params.resolution] *
        durationMultiplier[params.duration] *
        audioMultiplier;

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
    total: number;
    description: string;
} {
    const baseCredits: Record<VideoCreditsParams['resolution'], number> = {
        '480p': 60,
        '720p': 120,
        '1080p': 180
    };

    const durationMultiplierMap: Record<VideoCreditsParams['duration'], number> = {
        '4': 1.0,
        '8': 2.0,
        '12': 3.0
    };

    const base = baseCredits[params.resolution];
    const durationMultiplier = durationMultiplierMap[params.duration];
    const audioMultiplier = params.generateAudio ? 2.0 : 1.0;
    const total = calculateVideoCredits(params);

    const parts: string[] = [];
    parts.push(`${params.resolution} (${base} credits)`);
    parts.push(`${params.duration}s ×${durationMultiplier}`);
    if (params.generateAudio) {
        parts.push(`Audio ×2`);
    }

    return {
        base,
        durationMultiplier,
        audioMultiplier,
        total,
        description: `${parts.join(' × ')} = ${total} credits`
    };
}
