import { CURRENT_SCHEMA_VERSION, EditorDocument } from "./document";

type Raw = { schemaVersion?: unknown } & Record<string, unknown>;

/**
 * Upgrade steps keyed by the version they upgrade FROM. Add `1: (d) => ({ ...d, schemaVersion: 2 })`
 * when bumping CURRENT_SCHEMA_VERSION. Steps must be pure and never drop user data.
 */
const MIGRATIONS: Record<number, (doc: Raw) => Raw> = {};

/** Load any stored document: migrate forward, then validate. Throws on unknown/invalid input. */
export function migrate(input: unknown): EditorDocument {
  if (typeof input !== "object" || input === null) throw new TypeError("document must be an object");
  let doc = input as Raw;
  const raw = doc.schemaVersion;
  if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 1) {
    throw new TypeError(`invalid schemaVersion: ${String(raw)}`);
  }
  let version: number = raw;
  if (version > CURRENT_SCHEMA_VERSION) {
    throw new RangeError(`document v${version} is newer than this editor (v${CURRENT_SCHEMA_VERSION})`);
  }
  while (version < CURRENT_SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) throw new Error(`missing migration from v${version}`);
    doc = step(doc);
    version = doc.schemaVersion as number;
  }
  return EditorDocument.parse(doc);
}
