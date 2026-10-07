import type { Metadata } from "next";
import { ToolPage } from "../_components/tool-page";

export const metadata: Metadata = {
  title: "Design Templates",
  description: "Start from a layout instead of a blank canvas.",
  openGraph: { title: "Design Templates · PixelForge", description: "Start from a layout instead of a blank canvas." },
};

const BENEFITS = ["b1", "b2", "b3"] as const;

export default function TemplatesToolPage() {
  return <ToolPage namespace="site.tools.templates" benefitKeys={BENEFITS} />;
}
