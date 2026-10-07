import { prisma } from "@pixelforge/db";
import { PLANS } from "@pixelforge/shared";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getUser } from "@/lib/api";
import { UserActions } from "./user-actions";

export const dynamic = "force-dynamic";

const PAGE = 50;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cursor?: string }>;
}) {
  const { q = "", cursor } = await searchParams;
  const [t, format, me] = await Promise.all([getTranslations("admin"), getFormatter(), getUser()]);
  const query = q.trim().slice(0, 100);

  const rows = await prisma.user.findMany({
    where: query
      ? {
          OR: [{ email: { contains: query, mode: "insensitive" } }, { name: { contains: query, mode: "insensitive" } }],
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
  });
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
      <search>
        <form className="flex max-w-md gap-2">
          <label htmlFor="admin-q" className="sr-only">
            {t("search")}
          </label>
          <Input id="admin-q" name="q" defaultValue={query} placeholder={t("search")} type="search" />
          <Button type="submit" variant="outline">
            {t("search")}
          </Button>
        </form>
      </search>

      {users.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">{t("noUsers")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>{t("role")}</TableHead>
                <TableHead>{t("plan")}</TableHead>
                <TableHead className="text-right">{t("credits")}</TableHead>
                <TableHead>{t("joined")}</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{u.email}</span>
                      <span className="text-xs text-muted-foreground">{u.name}</span>
                    </div>
                    <div className="mt-1 flex gap-1">
                      {u.bannedAt && <Badge variant="destructive">{t("banned")}</Badge>}
                      {u.deletedAt && <Badge variant="outline">Deleted</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                  </TableCell>
                  <TableCell>{u.subscription?.planId ?? "free"}</TableCell>
                  <TableCell className="text-right tabular-nums">{balanceOf.get(u.id) ?? 0}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {format.dateTime(u.createdAt, { dateStyle: "medium" })}
                  </TableCell>
                  <TableCell>
                    <UserActions
                      userId={u.id}
                      email={u.email}
                      role={u.role}
                      planId={u.subscription?.planId ?? "free"}
                      banned={Boolean(u.bannedAt)}
                      isSelf={u.id === me?.id}
                      planIds={planIds}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex gap-2">
        {cursor && (
          <Button asChild variant="outline">
            <Link href={query ? `/admin?q=${encodeURIComponent(query)}` : "/admin"}>First page</Link>
          </Button>
        )}
        {nextCursor && (
          <Button asChild variant="outline">
            <Link href={`/admin?${new URLSearchParams({ ...(query ? { q: query } : {}), cursor: nextCursor })}`}>
              Next page
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
