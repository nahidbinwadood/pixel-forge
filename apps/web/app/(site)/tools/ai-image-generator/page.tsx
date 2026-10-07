import type { Metadata } from "next";
import { ToolPage } from "../_components/tool-page";

export const metadata: Metadata = {
  title: "AI Image Generator",
  description: "Turn a text prompt into an original image, then keep editing it.",
  openGraph: { title: "AI Image Generator · PixelForge", description: "Turn a text prompt into an original image." },
};

const BENEFITS = ["b1", "b2", "b3"] as const;

export default function AiImageGeneratorToolPage() {
  return <ToolPage namespace="site.tools.aiImageGenerator" benefitKeys={BENEFITS} />;
}
