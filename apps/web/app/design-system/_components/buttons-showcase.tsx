"use client";

import { ArrowRightIcon, PlusIcon, SparklesIcon, Trash2Icon, WandSparklesIcon } from "lucide-react";
import { Kbd } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Specimen } from "./section";

const VARIANTS = ["default", "premium", "secondary", "outline", "ghost", "glass", "destructive", "link"] as const;
const BADGES = ["default", "secondary", "outline", "aurora", "premium", "success", "warning", "destructive"] as const;

export function ButtonsShowcase() {
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-10">
        <Specimen label="Variants">
          {VARIANTS.map((v) => (
            <Button key={v} variant={v}>
              {v === "default" ? "Remove background" : v}
            </Button>
          ))}
        </Specimen>

        <Specimen label="Sizes & icons">
          <Button size="sm">
            <PlusIcon /> Small
          </Button>
          <Button>
            <WandSparklesIcon /> Default
          </Button>
          <Button size="lg">
            Start creating <ArrowRightIcon />
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="secondary" aria-label="Add">
                <PlusIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Add element <Kbd>A</Kbd>
            </TooltipContent>
          </Tooltip>
          <Button size="icon-sm" variant="ghost" aria-label="Delete">
            <Trash2Icon />
          </Button>
          <Button size="icon-lg" variant="glass" aria-label="AI">
            <SparklesIcon />
          </Button>
        </Specimen>

        <Specimen label="States">
          <Button loading>Generating</Button>
          <Button variant="secondary" loading>
            Saving
          </Button>
          <Button disabled>Disabled</Button>
          <Button variant="outline" disabled>
            Disabled outline
          </Button>
          <Button variant="secondary" asChild>
            <a href="#buttons">As link (asChild)</a>
          </Button>
        </Specimen>

        <Specimen label="Badges">
          {BADGES.map((b) => (
            <Badge key={b} variant={b}>
              {b}
            </Badge>
          ))}
        </Specimen>

        <Specimen label="Keyboard hints">
          <span className="flex items-center gap-1.5 text-sm text-text-2">
            Search <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
          <span className="flex items-center gap-1.5 text-sm text-text-2">
            Undo <Kbd>Ctrl</Kbd>
            <Kbd>Z</Kbd>
          </span>
        </Specimen>
      </div>
    </TooltipProvider>
  );
}
