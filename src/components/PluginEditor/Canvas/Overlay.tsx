import { useCallback, useEffect, useState, type RefObject } from "react";
import type { EditorController } from "@/lib/editor/EditorController";
import type { DomMap } from "@/lib/editor/domMap";
import type { NodeKey } from "@/lib/editor/model";
import { useEditorState } from "../hooks/useEditorState";
import { beginPointerDnd, type DropIndicator } from "./usePointerDnd";
import styles from "./Canvas.module.scss";

interface OutlineRect {
  left: number;
  top: number;
  width: number;
  height: number;
  tag: string;
}

interface OverlayProps {
  controller: EditorController;
  wrapperRef: RefObject<HTMLDivElement | null>;
  domMap: DomMap | null;
  bootVersion: number;
  dnd: { dragging: boolean; allowed: boolean; indicator: DropIndicator | null };
}

export function Overlay({ controller, wrapperRef, domMap, bootVersion, dnd }: OverlayProps) {
  const { mode, selection } = useEditorState(controller);
  const [hover, setHover] = useState<NodeKey | null>(null);
  const [selectionRect, setSelectionRect] = useState<OutlineRect | null>(null);
  const [hoverRect, setHoverRect] = useState<OutlineRect | null>(null);

  const rectFor = useCallback(
    (key: NodeKey | null): OutlineRect | null => {
      const wrapper = wrapperRef.current;
      const element = key ? domMap?.byKey.get(key) : undefined;
      if (!wrapper || !element) return null;
      const outer = wrapper.getBoundingClientRect();
      const inner = element.getBoundingClientRect();
      return {
        left: inner.left - outer.left + wrapper.scrollLeft,
        top: inner.top - outer.top + wrapper.scrollTop,
        width: inner.width,
        height: inner.height,
        tag: element.localName,
      };
    },
    [domMap, wrapperRef],
  );

  const refresh = useCallback(() => {
    setSelectionRect(rectFor(selection));
    setHoverRect(rectFor(hover));
  }, [hover, rectFor, selection]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    wrapper.addEventListener("scroll", refresh, true);
    const observer = new ResizeObserver(refresh);
    observer.observe(wrapper);
    return () => {
      wrapper.removeEventListener("scroll", refresh, true);
      observer.disconnect();
    };
  }, [refresh, wrapperRef]);
  useEffect(() => {
    const frame = requestAnimationFrame(refresh);
    return () => cancelAnimationFrame(frame);
  }, [bootVersion, refresh]);

  const hitTest = (x: number, y: number): NodeKey | null => {
    if (!domMap) return null;
    for (const hit of document.elementsFromPoint(x, y)) {
      let element: Element | null = hit;
      while (element) {
        const key = domMap.keyOf.get(element);
        if (key) return key;
        element = element.parentElement;
      }
    }
    return null;
  };

  if (mode === "play") return null;
  return (
    <div
      className={styles.overlay}
      data-dragging={dnd.dragging || undefined}
      data-drop-allowed={dnd.allowed || undefined}
      onClick={(event) => controller.select(hitTest(event.clientX, event.clientY))}
      onMouseMove={(event) => setHover(hitTest(event.clientX, event.clientY))}
      onMouseLeave={() => setHover(null)}
    >
      {hoverRect && hover !== selection && (
        <div className={styles.hoverOutline} style={hoverRect} />
      )}
      {selectionRect && (
        <div className={styles.selectionOutline} style={selectionRect}>
          <span className={styles.badge}>{selectionRect.tag}</span>
          {selection && selection !== controller.store.get().doc.key && (
            <button
              type="button"
              className={styles.dragHandle}
              aria-label={`Move ${selectionRect.tag}`}
              onPointerDown={(event) => beginPointerDnd(event, { kind: "move", key: selection })}
            >
              ⋮⋮
            </button>
          )}
        </div>
      )}
      {dnd.indicator &&
        (dnd.indicator.position === "inside" ? (
          <div className={styles.dropInside} style={dnd.indicator.rect} />
        ) : (
          <div
            className={styles.dropLine}
            style={{
              left: dnd.indicator.rect.left,
              top:
                dnd.indicator.position === "before"
                  ? dnd.indicator.rect.top
                  : dnd.indicator.rect.top + dnd.indicator.rect.height,
              width: dnd.indicator.rect.width,
            }}
          />
        ))}
    </div>
  );
}
