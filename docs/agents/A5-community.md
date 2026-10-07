# A5: Community, teams & sharing (roadmap Phases 8 + 9). Agent number N=5

Read `docs/PRD.md` (community/teams if present), `docs/DATA_MODEL.md` ("Planned models": Post, Comment, Like, Follow, Notification, Hashtag, Invite, ShareLink, DesignComment), `docs/SECURITY.md`, and the Workspace, Membership and Report models.

You own:
- `apps/web/app/(app)/{feed,u,notifications,team}/**`, `apps/web/app/(public)/p/**` (public post pages), `apps/web/app/share/**`
- `apps/web/app/api/v1/{posts,comments,likes,follows,notifications,users,workspaces,invites,share-links,reports}/**`
- `apps/web/components/{community,team}/**`
- the moderation tab `apps/web/app/(app)/admin/reports/**` (add a tab link)
- the namespaces `community` and `team`

Notes:
- The editor (A1) is built in parallel. Projects already exist as a model.
- "Publish" takes a project + an image asset (an export rendered by the client later). For now publish from an **uploaded or AI image asset**: pick from the library.
- "Remix" duplicates the source project into the user's workspace and links to `/editor/<id>`.
- Public visibility must be explicit (user content is private by default). Public images are served via short-lived signed URLs.
- Before any public sharing, check **moderation**: run the image through a `moderateImage` hook. A2 builds the Gemini moderation in `packages/ai`, so call it if available after merge, and stub it behind an interface in your code with a TODO linked to BACKLOG.

Build:
1. **Community:**
   - Public profile `/u/[handle]` (add a `handle` + `bio` + `avatar` to User; let users set them in a small settings card that you own) with banner, stats and a portfolio grid.
   - Publish flow (title, caption, tags/hashtags, "allow remix" toggle).
   - Feed `/feed` (Following / Trending tabs, cursor pagination, masonry).
   - Post page with likes, comments (threaded 1 level), save, share link and report.
   - Follow; hashtag pages; notifications (in-app bell + page; email via `sendEmail` for follows/comments, batched daily and opt-out-able).
2. **Moderation:** report queue in admin (resolve, hide post, ban user), plus a DMCA takedown action. All audit-logged.
3. **Teams:**
   - Create a team workspace, invite by email (token, expires 7 days, email via `sendEmail`), accept, and roles owner/admin/editor/viewer enforced by a `can(user, action, workspace)` helper with unit tests over a full RBAC matrix (ARCHITECTURE §6).
   - Workspace switcher in the top bar (minimal additive edit to `components/shell/top-bar.tsx`).
   - Share links for a project (view/comment/edit, expiring, revocable) with a `/share/[token]` read-only viewer (render the project thumbnail plus its info; the full editor comes after merge).
   - Design comments model + API.
4. **E2E** `e2e/community.spec.ts`: two users. A publishes a post from an upload; B follows A, likes, comments and reports; A gets a notification; admin hides the post. Plus team invite accept → role enforced (a viewer can't delete).
