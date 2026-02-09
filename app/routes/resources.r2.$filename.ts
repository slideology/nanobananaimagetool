import type { LoaderFunctionArgs } from "react-router";

export async function loader({ params, context }: LoaderFunctionArgs) {
    const filename = params.filename;
    if (!filename) {
        return new Response("Missing filename", { status: 400 });
    }

    // 尝试从 R2 获取文件 (images 目录下)
    // 注意: 这里使用的是 context.cloudflare.env.R2，在本地开发时它指向本地模拟的 R2
    const object = await context.cloudflare.env.R2.get(`images/${filename}`);

    if (!object) {
        return new Response("File not found in local R2", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);

    // 确保 Content-Type 正确
    if (!headers.get("Content-Type")) {
        const ext = filename.split(".").pop()?.toLowerCase();
        if (ext === "jpg" || ext === "jpeg") headers.set("Content-Type", "image/jpeg");
        else if (ext === "png") headers.set("Content-Type", "image/png");
        else if (ext === "webp") headers.set("Content-Type", "image/webp");
    }

    return new Response(object.body, { headers });
}
