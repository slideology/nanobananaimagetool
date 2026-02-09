/**
 * 视频积分计算工具
 * 根据视频参数计算所需积分
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
 * - 基础积分根据分辨率: 480p=2, 720p=5, 1080p=10
 * - 时长系数: 4s=1.0, 8s=1.5, 12s=2.0
 * - 音频额外消耗: +2积分
 * 
 * @param params 视频参数
 * @returns 所需积分数量
 */
export function calculateVideoCredits(params: VideoCreditsParams): number {
    // 基础积分(根据分辨率)
    const baseCredits: Record<VideoCreditsParams['resolution'], number> = {
        '480p': 2,
        '720p': 5,
        '1080p': 10
    };

    // 时长系数
    const durationMultiplier: Record<VideoCreditsParams['duration'], number> = {
        '4': 1.0,
        '8': 1.5,
        '12': 2.0
    };

    // 音频额外消耗
    const audioExtra = params.generateAudio ? 2 : 0;

    // 计算总积分(向上取整)
    const totalCredits = Math.ceil(
        baseCredits[params.resolution] *
        durationMultiplier[params.duration] +
        audioExtra
    );

    return totalCredits;
}

/**
 * 获取视频积分消耗的详细说明
 * 用于UI显示
 */
export function getVideoCreditsBreakdown(params: VideoCreditsParams): {
    base: number;
    duration: number;
    audio: number;
    total: number;
    description: string;
} {
    const baseCredits: Record<VideoCreditsParams['resolution'], number> = {
        '480p': 2,
        '720p': 5,
        '1080p': 10
    };

    const durationMultiplier: Record<VideoCreditsParams['duration'], number> = {
        '4': 1.0,
        '8': 1.5,
        '12': 2.0
    };

    const base = baseCredits[params.resolution];
    const duration = base * (durationMultiplier[params.duration] - 1);
    const audio = params.generateAudio ? 2 : 0;
    const total = calculateVideoCredits(params);

    const parts: string[] = [];
    parts.push(`${params.resolution} (${base} credits)`);
    if (duration > 0) {
        parts.push(`${params.duration}s duration (+${Math.ceil(duration)} credits)`);
    }
    if (audio > 0) {
        parts.push(`Audio (+${audio} credits)`);
    }

    return {
        base,
        duration,
        audio,
        total,
        description: parts.join(' + ')
    };
}
