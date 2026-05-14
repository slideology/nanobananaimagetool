import type { Route } from "./+types/route";
import { data } from "react-router";
import { nanoid } from "nanoid";

import { getSessionHandler } from "~/.server/libs/session";
import { uploadFiles } from "~/.server/services/r2-bucket";

export const action = async ({ request, context }: Route.ActionArgs) => {
  if (request.method.toLowerCase() !== "post") {
    throw new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const [session] = await getSessionHandler(request);
    const user = session.get("user");
    if (!user) {
      throw new Response(
        JSON.stringify({ error: "Please sign in to upload media." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const formData = await request.formData();
    const media = (formData.get("media") || formData.get("file")) as File;

    if (!media || !(media instanceof File)) {
      throw new Response(JSON.stringify({ error: "No media file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const allowedTypes = ["video/mp4", "video/quicktime"];
    const maxSize = 100 * 1024 * 1024;
    const minSize = 1024;

    if (!allowedTypes.includes(media.type)) {
      throw new Response(
        JSON.stringify({
          error: `Unsupported file type: ${media.type}. Only MP4 and MOV files are supported.`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (media.size > maxSize) {
      throw new Response(
        JSON.stringify({
          error: `File size must be less than 100MB. Current size: ${Math.round(media.size / 1024 / 1024)}MB.`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (media.size < minSize) {
      throw new Response(
        JSON.stringify({
          error: `File too small: ${media.size} bytes. Minimum size is 1KB.`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const fallbackExt = media.type === "video/quicktime" ? "mov" : "mp4";
    const extName = media.name.split(".").pop() || fallbackExt;
    const newFileName = `upload-${nanoid()}.${extName}`;
    const file = new File([media], newFileName, { type: media.type });
    const [R2Object] = await uploadFiles(context.cloudflare.env, file, "videos");

    if (!R2Object) {
      throw new Response(
        JSON.stringify({ error: "Upload failed. Please try again." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const mediaUrl = new URL(R2Object.key, context.cloudflare.env.CDN_URL).toString();

    return data({
      success: true,
      mediaUrl,
      fileName: newFileName,
      fileSize: media.size,
      fileType: media.type,
    });
  } catch (error) {
    console.error("Media upload error:", error);
    if (error instanceof Response) {
      throw error;
    }

    throw new Response(
      JSON.stringify({ error: "Upload failed. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export type MediaUploadResult = {
  success: boolean;
  mediaUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
};
