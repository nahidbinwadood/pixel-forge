"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { passwordSchema } from "@pixelforge/shared";
import { AtSignIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form } from "@/components/form/form";
import { FormCheckbox } from "@/components/form/form-checkbox";
import { FormCombobox } from "@/components/form/form-combobox";
import { FormInput } from "@/components/form/form-input";
import { FormPassword } from "@/components/form/form-password";
import { FormRadioGroup } from "@/components/form/form-radio-group";
import { FormSelect } from "@/components/form/form-select";
import { FormSlider } from "@/components/form/form-slider";
import { FormRootError, FormSubmit } from "@/components/form/form-submit";
import { FormSwitch } from "@/components/form/form-switch";
import { FormTextarea } from "@/components/form/form-textarea";
import { Button } from "@/components/ui/button";

const FONTS = [
  "Clash Display",
  "Geist",
  "Inter",
  "Poppins",
  "Playfair Display",
  "Bebas Neue",
  "Caveat",
  "Lora",
  "DM Serif",
  "Space Mono",
].map((f) => ({ value: f.toLowerCase().replaceAll(" ", "-"), label: f }));
const SIZES = [
  { value: "ig-post", label: "Instagram post · 1080×1080" },
  { value: "ig-story", label: "Instagram story · 1080×1920" },
  { value: "yt-thumb", label: "YouTube thumbnail · 1280×720" },
  { value: "a4", label: "A4 poster · 2480×3508", disabled: true },
];

const schema = z.object({
  title: z.string().trim().min(2, "At least 2 characters"),
  email: z.email("Enter a valid email"),
  password: passwordSchema,
  prompt: z.string().trim().min(10, "Describe it in at least 10 characters").max(280),
  size: z.string().min(1, "Pick a size"),
  font: z.string().min(1, "Pick a font"),
  tags: z.array(z.string()).min(2, "Pick at least two"),
  intensity: z.number().min(0).max(100),
  style: z.enum(["photo", "illustration", "3d"]),
  public: z.boolean(),
  terms: z.literal(true, { error: "Accept the content policy" }),
});
type Values = z.input<typeof schema>;

const defaults: Values = {
  title: "",
  email: "",
  password: "",
  prompt: "",
  size: "",
  font: "",
  tags: [],
  intensity: 60,
  style: "photo",
  public: false,
  terms: false as true,
};

export function FormShowcase() {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults, mode: "onTouched" });

  return (
    <Form
      form={form}
      onSubmit={async () => {
        await new Promise((r) => setTimeout(r, 700));
        toast.success("Valid! Nothing was sent.");
      }}
      className="grid gap-x-8 gap-y-6 rounded-3xl border bg-card p-6 surface-highlight md:grid-cols-2"
    >
      <FormInput<Values>
        name="title"
        label="FormInput"
        placeholder="Summer sale post"
        description="Plain text input."
      />
      <FormInput<Values>
        name="email"
        label="FormInput with icon"
        type="email"
        startIcon={<AtSignIcon />}
        placeholder="you@example.com"
      />
      <FormPassword<Values> name="password" label="FormPassword (showRules)" autoComplete="new-password" showRules />
      <FormTextarea<Values>
        name="prompt"
        label="FormTextarea (maxLength counter)"
        maxLength={280}
        rows={4}
        placeholder="A neon city at dusk…"
      />
      <FormSelect<Values> name="size" label="FormSelect" options={SIZES} placeholder="Choose a canvas size" />
      <FormCombobox<Values> name="font" label="FormCombobox (single)" options={FONTS} placeholder="Search fonts" />
      <FormCombobox<Values>
        name="tags"
        label="FormCombobox (multiple)"
        options={FONTS}
        multiple
        placeholder="Pick fonts to compare"
        description="Selected values become removable chips."
      />
      <FormSlider<Values> name="intensity" label="FormSlider" format={(v) => `${v}%`} />
      <FormRadioGroup<Values>
        name="style"
        label="FormRadioGroup"
        orientation="horizontal"
        options={[
          { value: "photo", label: "Photo" },
          { value: "illustration", label: "Illustration" },
          { value: "3d", label: "3D" },
        ]}
      />
      <div className="flex flex-col gap-5">
        <FormSwitch<Values> name="public" label="FormSwitch" description="Make this design remixable." />
        <FormCheckbox<Values> name="terms" label="FormCheckbox" description="I agree to the content policy." />
      </div>
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <FormRootError />
        <FormSubmit>Validate form</FormSubmit>
        <Button type="button" variant="ghost" onClick={() => form.reset(defaults)}>
          Reset
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => form.setError("root", { message: 'Example server error from form.setError("root")' })}
        >
          Show root error
        </Button>
      </div>
    </Form>
  );
}
