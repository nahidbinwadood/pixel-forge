import type { Metadata } from "next";
import { ToolPage } from "../_components/tool-page";

export const metadata: Metadata = {
  title: "Online Photo Editor",
  description: "Crop, adjust and filter any photo, free, right in your browser.",
  openGraph: { title: "Online Photo Editor · PixelForge", description: "Crop, adjust and filter any photo, free, right in your browser." },
};

const BENEFITS = ["b1", "b2", "b3", "b4"] as const;

export default function PhotoEditorToolPage() {
  return <ToolPage namespace="site.tools.photoEditor" benefitKeys={BENEFITS} />;
}
