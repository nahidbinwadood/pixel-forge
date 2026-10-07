import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorShell } from "@/components/editor/editor-shell";
import { userPlan } from "@/lib/account";
import { requireUser } from "@/lib/api";
import { openProject } from "@/lib/projects";

export const metadata: Metadata = { title: "Editor" };

/** Thin page: load the design + plan in parallel, then hand off to the client editor. */
export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user] = await Promise.all([params, requireUser()]);
  const [opened, plan] = await Promise.all([openProject(user.id, id), userPlan(user.id)]);
  if (!opened) notFound();
  return <EditorShell project={opened.project} assetUrls={opened.assetUrls} plan={plan} userId={user.id} />;
}
