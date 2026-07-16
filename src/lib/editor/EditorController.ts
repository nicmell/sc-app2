/** Stateful undo/redo wrapper around the editor's immutable document model. */

import { createStore, type ReadonlyStore, type Store } from "@/lib/utils/reactiveStore";
import { findNode, type EditorDoc, type NodeKey } from "./model";
import { EditorParseError, parseEntry } from "./parse";
import { serializeEntry } from "./serialize";

export interface EditorState {
  doc: EditorDoc;
  revision: number;
  selection: NodeKey | null;
  canUndo: boolean;
  canRedo: boolean;
  mode: "edit" | "play";
  view: "canvas" | "code";
  parseError: string | null;
}

interface Snapshot {
  doc: EditorDoc;
  selection: NodeKey | null;
}

interface HistoryEntry extends Snapshot {
  coalesceKey?: string;
}

export class EditorController {
  readonly store: ReadonlyStore<EditorState>;
  readonly #store: Store<EditorState>;
  readonly #undo: HistoryEntry[] = [];
  readonly #redo: Snapshot[] = [];
  #lastCoalesceKey: string | undefined;

  constructor(doc: EditorDoc) {
    this.#store = createStore<EditorState>({
      doc,
      revision: 0,
      selection: null,
      canUndo: false,
      canRedo: false,
      mode: "edit",
      view: "canvas",
      parseError: null,
    });
    this.store = this.#store;
  }

  commit(fn: (doc: EditorDoc) => EditorDoc, coalesceKey?: string): void {
    const state = this.#store.get();
    const doc = fn(state.doc);
    if (doc === state.doc) return;
    if (coalesceKey === undefined || coalesceKey !== this.#lastCoalesceKey) {
      this.#undo.push({ doc: state.doc, selection: state.selection, coalesceKey });
      if (this.#undo.length > 100) this.#undo.shift();
    }
    this.#lastCoalesceKey = coalesceKey;
    this.#redo.length = 0;
    this.#store.set({
      ...state,
      doc,
      revision: state.revision + 1,
      canUndo: this.#undo.length > 0,
      canRedo: false,
      parseError: null,
    });
  }

  undo(): void {
    const snapshot = this.#undo.pop();
    if (!snapshot) return;
    const state = this.#store.get();
    this.#redo.push({ doc: state.doc, selection: state.selection });
    this.#lastCoalesceKey = undefined;
    this.#restore(snapshot, state);
  }

  redo(): void {
    const snapshot = this.#redo.pop();
    if (!snapshot) return;
    const state = this.#store.get();
    this.#undo.push({ doc: state.doc, selection: state.selection });
    this.#lastCoalesceKey = undefined;
    this.#restore(snapshot, state);
  }

  select(selection: NodeKey | null): void {
    this.#store.update((state) => ({
      ...state,
      selection: selection !== null && findNode(state.doc, selection) ? selection : null,
    }));
  }

  setMode(mode: EditorState["mode"]): void {
    this.#store.update((state) => ({ ...state, mode }));
  }

  setView(view: EditorState["view"]): void {
    this.#store.update((state) => ({ ...state, view }));
  }

  applyXml(xml: string): void {
    const doc = parseEntry(xml);
    this.select(null);
    this.commit(() => doc);
  }

  serialize(): string {
    return serializeEntry(this.#store.get().doc);
  }

  setParseError(error: string | EditorParseError | null): void {
    this.#store.update((state) => ({
      ...state,
      parseError: error instanceof Error ? error.message : error,
    }));
  }

  #restore(snapshot: Snapshot, state: EditorState): void {
    const selection =
      snapshot.selection !== null && findNode(snapshot.doc, snapshot.selection)
        ? snapshot.selection
        : null;
    this.#store.set({
      ...state,
      doc: snapshot.doc,
      selection,
      revision: state.revision + 1,
      canUndo: this.#undo.length > 0,
      canRedo: this.#redo.length > 0,
      parseError: null,
    });
  }
}
