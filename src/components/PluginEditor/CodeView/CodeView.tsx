import { useEffect, useRef, useState } from "react";
import { Alert, Button, Flex } from "@/components/ui";
import type { EditorController } from "@/lib/editor/EditorController";
import { EditorParseError } from "@/lib/editor/parse";
import type { EditorView } from "@codemirror/view";
import type { KeyBinding } from "@codemirror/view";
import { cmSchemaFromSpecs } from "./cmSchema";
import styles from "./CodeView.module.scss";

export interface CodeViewProps {
  controller: EditorController;
}

export function CodeView({ controller }: CodeViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const baselineRef = useRef("");
  const applyRef = useRef<() => void>(() => undefined);
  const [unapplied, setUnapplied] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let lastApplyError: string | null = null;

    void Promise.all([
      import("@codemirror/state"),
      import("@codemirror/view"),
      import("@codemirror/commands"),
      import("@codemirror/lang-xml"),
      import("@codemirror/lint"),
    ]).then(([stateModule, viewModule, commandsModule, xmlModule, lintModule]) => {
      if (disposed) return;

      const { EditorState } = stateModule;
      const { EditorView, keymap, lineNumbers } = viewModule;
      const { defaultKeymap, history, historyKeymap } = commandsModule;
      const { xml } = xmlModule;
      const { forceLinting, lintGutter, linter } = lintModule;
      const initialDoc = controller.serialize();
      baselineRef.current = initialDoc;

      const apply = () => {
        const view = viewRef.current;
        if (!view) return;
        const source = view.state.doc.toString();
        try {
          controller.applyXml(source);
          controller.setParseError(null);
          baselineRef.current = source;
          lastApplyError = null;
          setApplyError(null);
          setUnapplied(false);
        } catch (error) {
          if (!(error instanceof EditorParseError)) throw error;
          lastApplyError = error.message;
          controller.setParseError(error);
          setApplyError(error.message);
          (forceLinting as unknown as (editor: EditorView) => void)(view);
        }
      };
      applyRef.current = apply;

      const editor = new EditorView({
        parent: host,
        state: EditorState.create({
          doc: initialDoc,
          extensions: [
            lineNumbers(),
            history(),
            keymap.of([
              ...defaultKeymap,
              ...historyKeymap,
              { key: "Mod-Enter", run: () => (apply(), true) },
            ] as KeyBinding[]),
            xml(cmSchemaFromSpecs()),
            lintGutter(),
            linter((view) =>
              lastApplyError
                ? [
                    {
                      from: 0,
                      to: Math.min(view.state.doc.length, view.state.doc.line(1).length),
                      severity: "error",
                      message: lastApplyError,
                    },
                  ]
                : [],
            ),
            EditorView.updateListener.of((update) => {
              if (update.docChanged) {
                setUnapplied(update.state.doc.toString() !== baselineRef.current);
              }
            }),
          ],
        }),
      });
      viewRef.current = editor;
    });

    return () => {
      disposed = true;
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [controller]);

  const discard = () => {
    const view = viewRef.current;
    if (!view) return;
    const source = controller.serialize();
    baselineRef.current = source;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: source } });
    controller.setParseError(null);
    setApplyError(null);
    setUnapplied(false);
  };

  const stopParentUndo = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
      event.stopPropagation();
    }
  };

  return (
    <div className={styles.codeView}>
      <Flex className={styles.toolbar} align="center" gap="xs">
        <Button size="sm" label="Apply" onClick={() => applyRef.current()} />
        <Button size="sm" variant="ghost" label="Discard" disabled={!unapplied} onClick={discard} />
        {unapplied && <span className={styles.unapplied}>Unapplied changes</span>}
      </Flex>
      {applyError && (
        <Alert variant="error" className={styles.error}>
          {applyError}
        </Alert>
      )}
      <div
        ref={hostRef}
        className={styles.editor}
        onKeyDown={stopParentUndo}
        aria-label="Plugin XML code"
      />
    </div>
  );
}
