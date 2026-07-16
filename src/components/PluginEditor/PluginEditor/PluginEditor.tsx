import { useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui";
import { EditorController, type EditorState } from "@/lib/editor/EditorController";
import { parseEntry } from "@/lib/editor/parse";
import { serializeEntry } from "@/lib/editor/serialize";
import { Canvas } from "../Canvas/Canvas";
import { CodeView } from "../CodeView";
import { Inspector } from "../Inspector";
import { Outline } from "../Outline/Outline";
import { Palette } from "../Palette";
import { useEditorState } from "../hooks/useEditorState";
import styles from "./PluginEditor.module.scss";

export interface PluginEditorProps {
  initialXml: string;
  onDirtyChange?: (dirty: boolean) => void;
  controllerRef?: (controller: EditorController) => void;
}

function isEditableTarget(event: React.KeyboardEvent): boolean {
  return event.nativeEvent
    .composedPath()
    .some(
      (target) =>
        target instanceof Element &&
        target.matches("input, textarea, [contenteditable]:not([contenteditable='false'])"),
    );
}

function EditorShell({
  controller,
  initialXml,
  onDirtyChange,
  controllerRef,
}: PluginEditorProps & { controller: EditorController }) {
  const canUndo = useEditorState(
    controller,
    useCallback((state) => state.canUndo, []),
  );
  const canRedo = useEditorState(
    controller,
    useCallback((state) => state.canRedo, []),
  );
  const mode = useEditorState(
    controller,
    useCallback((state) => state.mode, []),
  );
  const view = useEditorState(
    controller,
    useCallback((state) => state.view, []),
  );
  const revision = useEditorState(
    controller,
    useCallback((state) => state.revision, []),
  );
  const parseError = useEditorState(
    controller,
    useCallback((state) => state.parseError, []),
  );
  const initialSerialized = useMemo(() => serializeEntry(parseEntry(initialXml)), [initialXml]);

  useEffect(() => controllerRef?.(controller), [controller, controllerRef]);
  useEffect(
    () => onDirtyChange?.(controller.serialize() !== initialSerialized),
    [controller, initialSerialized, onDirtyChange, revision],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (isEditableTarget(event) || !(event.metaKey || event.ctrlKey)) return;
    if (event.key.toLowerCase() !== "z") return;
    event.preventDefault();
    if (event.shiftKey) controller.redo();
    else controller.undo();
  };

  const setMode = (nextMode: EditorState["mode"]) => controller.setMode(nextMode);
  const setView = (nextView: EditorState["view"]) => controller.setView(nextView);

  return (
    <div className={styles.editor} tabIndex={-1} onKeyDown={handleKeyDown}>
      <header className={styles.toolbar}>
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          icon="arrow-counter-clockwise"
          label="Undo"
          disabled={!canUndo}
          onClick={() => controller.undo()}
        />
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          icon="arrow-clockwise"
          label="Redo"
          disabled={!canRedo}
          onClick={() => controller.redo()}
        />
        <div className={styles.buttonGroup} aria-label="Editor mode">
          <Button
            variant={mode === "edit" ? "primary" : "ghost"}
            size="sm"
            label="Edit"
            onClick={() => setMode("edit")}
          />
          <Button
            variant={mode === "play" ? "primary" : "ghost"}
            size="sm"
            label="Play"
            onClick={() => setMode("play")}
          />
        </div>
        <div className={styles.buttonGroup} aria-label="Editor view">
          <Button
            variant={view === "canvas" ? "primary" : "ghost"}
            size="sm"
            label="Canvas"
            onClick={() => setView("canvas")}
          />
          <Button
            variant={view === "code" ? "primary" : "ghost"}
            size="sm"
            label="Code"
            onClick={() => setView("code")}
          />
        </div>
        <span className={styles.status}>{parseError ?? ""}</span>
      </header>
      <div className={styles.workspace}>
        <aside className={styles.leftPane}>
          <section className={styles.palette}>
            <h2>Palette</h2>
            <Palette controller={controller} />
          </section>
          <section className={styles.outline}>
            <h2>Outline</h2>
            <Outline controller={controller} />
          </section>
        </aside>
        <section className={styles.centerPane} aria-label="Editor canvas">
          {view === "canvas" ? <Canvas controller={controller} /> : <CodeView controller={controller} />}
        </section>
        <aside className={styles.rightPane}>
          <h2>Inspector</h2>
          <Inspector controller={controller} />
        </aside>
      </div>
    </div>
  );
}

export function PluginEditor(props: PluginEditorProps) {
  const result = useMemo(() => {
    try {
      return { controller: new EditorController(parseEntry(props.initialXml)), error: null };
    } catch (error) {
      return {
        controller: null,
        error: error instanceof Error ? error.message : "Unable to parse plugin entry",
      };
    }
  }, [props.initialXml]);

  if (!result.controller) {
    return <div className={styles.parseFailure}>{result.error}</div>;
  }
  return <EditorShell {...props} controller={result.controller} />;
}
