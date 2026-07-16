import { useSyncExternalStore } from "react";
import type { EditorController, EditorState } from "@/lib/editor/EditorController";

export function useEditorState(controller: EditorController): EditorState {
  return useSyncExternalStore(controller.store.subscribe, controller.store.get);
}
