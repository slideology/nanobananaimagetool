import type { Route } from "./+types/route";

export const loader = async ({ request }: Route.LoaderArgs) => {
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl) {
        return new Response('Missing image URL', { status: 400 });
    }

    try {
        // 从 CDN 获取图片
        const response = await fetch(imageUrl);

        if (!response.ok) {
            return new Response('Failed to fetch image', { status: response.status });
        }

        // 获取图片数据
        const imageBlob = await response.blob();

        // 返回图片,设置下载头
        return new Response(imageBlob, {
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'image/png',
                'Content-Disposition': `attachment; filename="nanobanana-image.png"`,
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        console.error('Image proxy error:', error);
        return new Response('Internal server error', { status: 500 });
    }
};
