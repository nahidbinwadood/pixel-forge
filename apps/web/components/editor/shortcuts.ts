/** Keyboard shortcuts (PRD US3.7). `mod` = ⌘ on macOS, Ctrl elsewhere. Labels live in messages/en/editor.json. */
export interface Shortcut {
  id: string;
  keys: string[];
  group: "edit" | "arrange" | "view";
}

export const SHORTCUTS: readonly Shortcut[] = [
  { id: "undo", keys: ["mod", "Z"], group: "edit" },
  { id: "redo", keys: ["mod", "Shift", "Z"], group: "edit" },
  { id: "duplicate", keys: ["mod", "D"], group: "edit" },
  { id: "delete", keys: ["Del"], group: "edit" },
  { id: "selectAll", keys: ["mod", "A"], group: "edit" },
  { id: "deselect", keys: ["Esc"], group: "edit" },
  { id: "editText", keys: ["Enter"], group: "edit" },
  { id: "addText", keys: ["T"], group: "edit" },
  { id: "export", keys: ["mod", "E"], group: "edit" },
  { id: "nudge", keys: ["←", "→", "↑", "↓"], group: "arrange" },
  { id: "nudgeMore", keys: ["Shift", "Arrow"], group: "arrange" },
  { id: "forward", keys: ["mod", "]"], group: "arrange" },
  { id: "backward", keys: ["mod", "["], group: "arrange" },
  { id: "front", keys: ["mod", "Shift", "]"], group: "arrange" },
  { id: "back", keys: ["mod", "Shift", "["], group: "arrange" },
  { id: "group", keys: ["mod", "G"], group: "arrange" },
  { id: "ungroup", keys: ["mod", "Shift", "G"], group: "arrange" },
  { id: "lock", keys: ["mod", "Shift", "L"], group: "arrange" },
  { id: "zoomIn", keys: ["mod", "+"], group: "view" },
  { id: "zoomOut", keys: ["mod", "−"], group: "view" },
  { id: "zoomFit", keys: ["mod", "0"], group: "view" },
  { id: "pan", keys: ["Space", "Drag"], group: "view" },
  { id: "grid", keys: ["mod", "'"], group: "view" },
  { id: "compare", keys: ["\\"], group: "view" },
  { id: "help", keys: ["?"], group: "view" },
];

export const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);

export const keyLabel = (k: string) => (k === "mod" ? (isMac() ? "⌘" : "Ctrl") : k);

/** "mod+shift+z" style label for menus. */
export function shortcutLabel(id: string): string {
  const s = SHORTCUTS.find((x) => x.id === id);
  return s ? s.keys.map(keyLabel).join(isMac() ? "" : "+") : "";
}

/** Typing in a field must never trigger canvas shortcuts. */
export function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.role === "slider")
  );
}
