"use client";

import { ImageIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LightSweep } from "@/components/brand/light-sweep";
import { CreditMeter } from "@/components/shared/credit-meter";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Specimen } from "./section";

const LAKE = [
  { id: "vivid", label: "Vivid", src: "/hero/lake-vivid.webp" },
  { id: "film", label: "Film", src: "/hero/lake-film.webp" },
  { id: "mono", label: "Mono", src: "/hero/lake-mono.webp" },
] as const;

export function FeedbackShowcase() {
  const [balance, setBalance] = useState(22);
  return (
    <div className="flex flex-col gap-10">
      <Specimen label="Cards" className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Default card</CardTitle>
            <CardDescription>Surface-2 with inner highlight.</CardDescription>
          </CardHeader>
          <CardContent className="text-text-2">Use for grouped settings or content.</CardContent>
          <CardFooter>
            <Button size="sm" variant="secondary">
              Action
            </Button>
          </CardFooter>
        </Card>
        <div className="flex flex-col gap-2 rounded-2xl border bg-surface-1 p-5">
          <span className="text-sm font-semibold">Panel (surface-1)</span>
          <span className="text-sm text-muted-foreground">Sidebars, editor panels, quiet regions.</span>
        </div>
        <div className="relative overflow-hidden rounded-2xl border p-5">
          <div aria-hidden className="absolute inset-0 -z-10 bg-mesh opacity-60" />
          <span className="text-sm font-semibold">Feature panel (mesh)</span>
          <p className="text-sm text-text-2">Marketing only. Never behind working UI.</p>
        </div>
      </Specimen>

      <Specimen label="Empty state" className="grid">
        <EmptyState
          icon={<ImageIcon />}
          title="No uploads yet"
          description="Drop a photo here to start editing. JPG, PNG, WebP, GIF or HEIC."
          action={<Button>Upload a photo</Button>}
        />
      </Specimen>

      <Specimen label="Credit meter (count-up)">
        <CreditMeter balance={balance} allowance={30} label={`${balance} credits`} />
        <Button size="sm" variant="outline" onClick={() => setBalance((b) => Math.max(0, b - 4))}>
          Spend 4
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setBalance(30)}>
          Refill
        </Button>
      </Specimen>

      <Specimen label="Loading" className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-3">
          <Skeleton className="aspect-video rounded-xl" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="aspect-video rounded-xl bg-surface-2 shimmer" aria-label="Generating" role="img" />
        <div className="flex flex-col justify-center gap-2">
          <span className="text-sm text-text-2">Export 64%</span>
          <Progress value={64} aria-label="Export progress" />
        </div>
      </Specimen>

      <Specimen label="Toasts">
        <Button size="sm" variant="secondary" onClick={() => toast.success("Background removed")}>
          Success
        </Button>
        <Button size="sm" variant="secondary" onClick={() => toast.error("Upload failed: file is not an image")}>
          Error
        </Button>
        <Button size="sm" variant="secondary" onClick={() => toast("Saved to your library")}>
          Neutral
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            toast.promise(new Promise((r) => setTimeout(r, 1500)), {
              loading: "Generating…",
              success: "4 images ready",
              error: "Generation failed",
            })
          }
        >
          Promise
        </Button>
      </Specimen>

      <Specimen label="LightSweep (signature) · drag or use arrow keys" className="max-w-2xl">
        <LightSweep original="/hero/lake-original.webp" presets={LAKE} alt="Alpine lake under storm clouds" />
      </Specimen>
    </div>
  );
}
