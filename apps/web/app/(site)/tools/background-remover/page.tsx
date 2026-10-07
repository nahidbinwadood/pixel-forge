import type { Metadata } from "next";
import { ToolPage } from "../_components/tool-page";

export const metadata: Metadata = {
  title: "AI Background Remover",
  description: "Cut out any subject in one click with PixelForge's AI background remover.",
  openGraph: { title: "AI Background Remover · PixelForge", description: "Cut out any subject in one click." },
};

const BENEFITS = ["b1", "b2", "b3"] as const;

export default function BackgroundRemoverToolPage() {
  return <ToolPage namespace="site.tools.backgroundRemover" benefitKeys={BENEFITS} />;
}
