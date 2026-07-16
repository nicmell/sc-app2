import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { EditorController } from "@/lib/editor/EditorController";
import { buildDomMap, type DomMap } from "@/lib/editor/domMap";
import { serializeEntry } from "@/lib/editor/serialize";
import { randomId } from "@/lib/utils/randomId";
import { Overlay } from "./Overlay";
import { useEditorState } from "../hooks/useEditorState";
import { usePointerDnd } from "./usePointerDnd";
import styles from "./Canvas.module.scss";

export function PreviewHost({ controller }: { controller: EditorController }) {
  const state = useEditorState(controller);
  const [hostId] = useState(() => `editor:${randomId()}`);
  const [preview, setPreview] = useState(() => ({
    revision: state.revision,
    doc: state.doc,
  }));
  const [domMap, setDomMap] = useState<DomMap | null>(null);
  const [bootVersion, setBootVersion] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLElement>(null);
  const dnd = usePointerDnd({ controller, domMap, wrapperRef });

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setPreview({ revision: state.revision, doc: state.doc }),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [state.doc, state.revision]);

  const xml = useMemo(() => serializeEntry(preview.doc), [preview]);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const onBoot = (event: Event) => {
      const error = (event as CustomEvent<{ error: string | null }>).detail.error;
      controller.setParseError(error);
      setDomMap(buildDomMap(host, preview.doc));
      setBootVersion((version) => version + 1);
    };
    host.addEventListener("sc-boot", onBoot);
    return () => host.removeEventListener("sc-boot", onBoot);
  }, [controller, preview]);

  return (
    <div ref={wrapperRef} className={styles.previewWrapper}>
      <sc-plugin
        key={preview.revision}
        ref={hostRef}
        id={hostId}
        source={xml}
        className={styles.preview}
      />
      <Overlay
        controller={controller}
        wrapperRef={wrapperRef}
        domMap={domMap}
        bootVersion={bootVersion}
        dnd={dnd}
      />
    </div>
  );
}
