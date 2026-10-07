import { ArrowRightIcon, ImagesIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { LibraryGrid } from "./library-grid";

export interface LibraryItem {
  id: string;
  processing: boolean;
  name: string;
  thumbUrl: string | null;
}

/** "Your library": the 8 newest uploads, or a directed empty state. */
export async function Library({ items }: { items: LibraryItem[] }) {
  const t = await getTranslations("home");
  return (
    <section aria-labelledby="library" className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <h2 id="library" className="text-h2">
          {t("library")}
        </h2>
        {items.length > 0 && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/uploads">
              {t("viewAll")}
              <ArrowRightIcon aria-hidden />
            </Link>
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <EmptyState icon={<ImagesIcon />} title={t("libraryEmptyTitle")} description={t("libraryEmptyBody")} />
      ) : (
        <LibraryGrid items={items} processingLabel={t("processing")} />
      )}
    </section>
  );
}
