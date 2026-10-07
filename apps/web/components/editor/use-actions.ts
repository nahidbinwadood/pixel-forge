"use client";

import { useMemo } from "react";
import { editorActions } from "./actions";
import { useEditorStore } from "./store";

export function useActions() {
  const store = useEditorStore();
  return useMemo(() => editorActions(store), [store]);
}
