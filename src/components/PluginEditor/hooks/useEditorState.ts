import { useMemo, useSyncExternalStore } from "react";
import { EditorController, type EditorState } from "@/lib/editor/EditorController";

export function useEditorState<T>(
  controller: EditorController,
  selector: (state: EditorState) => T,
): T {
  const selected = useMemo(() => controller.store.select(selector), [controller, selector]);
  return useSyncExternalStore(selected.subscribe, selected.get);
}
