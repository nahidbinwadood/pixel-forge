import { getUser, route } from "@/lib/api";
import { allFlags } from "@/lib/flags";

export const GET = route(async () => Response.json(await allFlags(await getUser())));
