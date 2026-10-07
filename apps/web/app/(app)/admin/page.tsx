import { prisma } from "@pixelforge/db";
import { PLANS } from "@pixelforge/shared";
import { SearchXIcon } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getUser } from "@/lib/api";
import { UserRowActions } from "./_components/user-row-actions";
import { UserSearch } from "./_components/user-search";

export const dynamic = "force-dynamic";

const PAGE = 50;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cursor?: string }>;
}) {
  const { q = "", cursor } = await searchParams;
  const query = q.trim().slice(0, 100);

  const [t, format, me, rows] = await Promise.all([
    getTranslations("admin"),
    getFormatter(),
    getUser(),
    prisma.user.findMany({
      where: query
        ? {
            OR: [
              { email: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PAGE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        bannedAt: true,
        deletedAt: true,
        subscription: { select: { planId: true } },
      },
    }),
  ]);
  const users = rows.slice(0, PAGE);
  const nextCursor = rows.length > PAGE ? users.at(-1)?.id : undefined;

  // One grouped query for the whole page, not one per row.
  const balances = await prisma.creditLedger.groupBy({
    by: ["userId"],
    where: { userId: { in: users.map((u) => u.id) } },
    _sum: { delta: true },
  });
  const balanceOf = new Map(balances.map((b) => [b.userId, b._sum.delta ?? 0]));
  const planIds = Object.keys(PLANS);

  return (
    <div className="flex flex-col gap-4">
      <UserSearch defaultValue={query} />

      {users.length === 0 ? (
        <EmptyState icon={<SearchXIcon />} title={t("noUsers")} description={t("noUsersDesc")} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card surface-highlight">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="ps-4">{t("user")}</TableHead>
                <TableHead>{t("role")}</TableHead>
                <TableHead>{t("plan")}</TableHead>
                <TableHead className="text-end">{t("credits")}</TableHead>
                <TableHead>{t("joined")}</TableHead>
                <TableHead className="pe-4 text-end">
                  <span className="sr-only">{t("actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const planId = u.subscription?.planId ?? "free";
                return (
                  <TableRow key={u.id} className="h-12">
                    <TableCell className="max-w-[22rem] ps-4">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-medium">{u.email}</span>
                        {u.name && <span className="truncate text-muted-foreground">{u.name}</span>}
                        {u.bannedAt && <Badge variant="destructive">{t("banned")}</Badge>}
                        {u.deletedAt && <Badge variant="outline">{t("deleted")}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === "admin" ? "default" : "outline"}>{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={planId === "free" ? "secondary" : "premium"}>{planId}</Badge>
                    </TableCell>
                    <TableCell className="text-end font-mono tabular-nums">{balanceOf.get(u.id) ?? 0}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {format.dateTime(u.createdAt, { dateStyle: "medium" })}
                    </TableCell>
                    <TableCell className="pe-4 text-end">
                      <UserRowActions
                        userId={u.id}
                        email={u.email}
                        role={u.role}
                        planId={planId}
                        banned={Boolean(u.bannedAt)}
                        isSelf={u.id === me?.id}
                        planIds={planIds}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {(cursor || nextCursor) && (
        <nav aria-label="Pagination" className="flex gap-2">
          {cursor && (
            <Button asChild variant="outline" size="sm">
              <Link href={query ? `/admin?q=${encodeURIComponent(query)}` : "/admin"}>{t("firstPage")}</Link>
            </Button>
          )}
          {nextCursor && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin?${new URLSearchParams({ ...(query ? { q: query } : {}), cursor: nextCursor })}`}>
                {t("nextPage")}
              </Link>
            </Button>
          )}
        </nav>
      )}
    </div>
  );
}
