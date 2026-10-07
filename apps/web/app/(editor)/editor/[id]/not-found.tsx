import { ArrowLeftIcon, FileQuestionIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default async function EditorNotFound() {
  const t = await getTranslations("editor");
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <EmptyState
        icon={<FileQuestionIcon />}
        title={t("notFound")}
        description={t("notFoundBody")}
        action={
          <Button asChild>
            <Link href="/projects">
              <ArrowLeftIcon aria-hidden /> {t("back")}
            </Link>
          </Button>
        }
      />
    </div>
  );
}
