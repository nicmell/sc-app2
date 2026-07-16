import { useMemo, useSyncExternalStore } from "react";
import { EditorController, type EditorState } from "@/lib/editor/EditorController";
import type { ReadonlyStore } from "@/lib/utils/reactiveStore";

/** Subscribe to the editor store — whole state, or an Object.is-guarded
 *  selected view when a (stable) selector is given. */
export function useEditorState(controller: EditorController): EditorState;
export function useEditorState<T>(
  controller: EditorController,
  selector: (state: EditorState) => T,
): T;
export function useEditorState<T>(
  controller: EditorController,
  selector?: (state: EditorState) => T,
): T | EditorState {
  const source = useMemo(
    () =>
      (selector ? controller.store.select(selector) : controller.store) as ReadonlyStore<
        T | EditorState
      >,
    [controller, selector],
  );
  return useSyncExternalStore(source.subscribe, source.get);
}
