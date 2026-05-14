import type { Route } from "./+types/route";
import { Fragment } from "react";

import { ImageGenerator } from "~/features/image_generator";
import type {
  ImageGenerationMode,
  ImageModelId,
} from "~/features/image_generator/model-config";
import { VideoGenerator } from "~/features/video_generator/index";
import { VideoResult } from "~/features/video_generator/VideoResult";
import { useVideoGenerator } from "~/features/video_generator/useVideoGenerator";
import type {
  VideoMode,
  VideoModel,
} from "~/features/video_generator/types";
import { getPublicModelBySlug } from "~/constants";
import { createCanonical } from "~/utils/meta";

export function meta({ params, matches }: Route.MetaArgs) {
  const model = getPublicModelBySlug(params.slug);
  const canonical = createCanonical(`/model/${params.slug}`, matches[0].data.DOMAIN);

  if (!model) {
    return [{ title: "Model Not Found" }, canonical];
  }

  return [
    { title: model.seo.title },
    {
      name: "description",
      content: model.seo.description,
    },
    {
      name: "keywords",
      content: model.seo.keywords,
    },
    canonical,
  ];
}

export function loader({ params }: Route.LoaderArgs) {
  const model = getPublicModelBySlug(params.slug);
  if (!model) {
    throw new Response("Not Found", { status: 404 });
  }

  return { model };
}

export default function ModelPage({ loaderData }: Route.ComponentProps) {
  const { model } = loaderData;
  const videoState = useVideoGenerator();
  const isVideo = model.mediaType === "video";
  const isVideoPreview =
    model.thumbnailUrl?.endsWith(".webm") || model.thumbnailUrl?.endsWith(".mp4");

  return (
    <Fragment>
      <section className="relative min-h-[560px] overflow-hidden bg-gray-950 text-white">
        {model.thumbnailUrl && isVideoPreview ? (
          <video
            src={model.thumbnailUrl}
            className="absolute inset-0 h-full w-full object-cover opacity-55"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : model.thumbnailUrl ? (
          <img
            src={model.thumbnailUrl}
            alt={model.displayName}
            className="absolute inset-0 h-full w-full object-cover opacity-55"
          />
        ) : null}
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative container mx-auto flex min-h-[560px] max-w-7xl flex-col justify-end px-4 pb-12 pt-28">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-purple-200">
            {model.vendor} {model.mediaType === "image" ? "Image Model" : "Video Model"}
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            {model.displayName}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-gray-100 md:text-lg">
            {model.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-gray-100">
            <span className="rounded-lg border border-white/20 bg-white/10 px-3 py-2">
              {model.capabilities.modes.map(formatModeName).join(" / ")}
            </span>
            {model.capabilities.resolutions?.length ? (
              <span className="rounded-lg border border-white/20 bg-white/10 px-3 py-2">
                {model.capabilities.resolutions.join(", ")}
              </span>
            ) : null}
            <span className="rounded-lg border border-white/20 bg-white/10 px-3 py-2">
              {formatPrice(model.pricing.providerPriceUsd, model.pricing.billingUnit)}
            </span>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="container mx-auto max-w-7xl px-4">
          {isVideo ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <VideoGenerator
                initialModel={model.id as VideoModel}
                initialMode={model.defaultMode as VideoMode}
                onTaskCreated={videoState.createTask}
              />
              <VideoResult
                currentTask={videoState.currentTask}
                recentTasks={videoState.recentTasks}
                resultTitle={`${model.displayName} AI Video Result`}
                downloadPrefix={model.slug}
              />
            </div>
          ) : (
            <ImageGenerator
              styles={[]}
              promptCategories={[]}
              inline
              initialModel={model.id as ImageModelId}
              initialMode={model.defaultMode as ImageGenerationMode}
            />
          )}
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="container mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 md:grid-cols-3">
          <InfoPanel
            title="Default Mode"
            value={formatModeName(model.defaultMode)}
          />
          <InfoPanel
            title="Reference Inputs"
            value={
              model.capabilities.maxReferenceImages
                ? `Up to ${model.capabilities.maxReferenceImages}`
                : "Prompt only"
            }
          />
          <InfoPanel
            title="Provider Model"
            value={model.providerModel}
          />
        </div>
      </section>
    </Fragment>
  );
}

function InfoPanel({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </p>
      <p className="mt-2 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function formatModeName(mode: string) {
  return mode
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatPrice(price: number, unit: "generation" | "second") {
  return unit === "second"
    ? `$${price.toFixed(4)}/s`
    : `$${price.toFixed(3)}/generation`;
}
