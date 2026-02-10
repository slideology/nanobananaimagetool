import type { Route } from "./+types/route";

export const loader = async ({ request }: Route.LoaderArgs) => {
    const url = new URL(request.url);
    const videoUrl = url.searchParams.get('url');
    const filename = url.searchParams.get('filename') || 'video';

    if (!videoUrl) {
        return new Response('Missing video URL', { status: 400 });
    }

    try {
        // Fetch from upstream (R2 or CDN)
        const response = await fetch(videoUrl);

        if (!response.ok) {
            return new Response('Failed to fetch video', { status: response.status });
        }

        // Return stream with attachment header
        return new Response(response.body, {
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'video/mp4',
                'Content-Disposition': `attachment; filename="${filename}.mp4"`,
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        console.error('Video proxy error:', error);
        return new Response('Internal server error', { status: 500 });
    }
};
