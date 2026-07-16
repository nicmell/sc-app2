import {
  useCallback,
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { canContain } from "@/lib/editor/contentModel";
import type { DomMap } from "@/lib/editor/domMap";
import { computeDrop, type DropCandidate, type DropDecision } from "@/lib/editor/dropTarget";
import {
  findNode,
  findPath,
  insertChild,
  moveNode,
  type EditorDoc,
  type ElementNode,
  type NodeKey,
} from "@/lib/editor/model";
import type { EditorController } from "@/lib/editor/EditorController";

export type PointerDndPayload =
  | { kind: "new"; tag: string; template: () => ElementNode }
  | { kind: "move"; key: NodeKey };

interface DragStartDetail {
  payload: PointerDndPayload;
  pointerId: number;
}
const START_EVENT = "sc-editor-dnd-start";

export function beginPointerDnd(event: ReactPointerEvent<HTMLElement>, payload: PointerDndPayload) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);
  window.dispatchEvent(
    new CustomEvent<DragStartDetail>(START_EVENT, {
      detail: { payload, pointerId: event.pointerId },
    }),
  );
}

export interface DropIndicator extends DropDecision {
  rect: { left: number; top: number; width: number; height: number };
}

interface UsePointerDndOptions {
  controller: EditorController;
  domMap: DomMap | null;
  wrapperRef: RefObject<HTMLDivElement | null>;
}

export function usePointerDnd({ controller, domMap, wrapperRef }: UsePointerDndOptions) {
  const [drag, setDrag] = useState<{ payload: PointerDndPayload; pointerId: number } | null>(null);
  const [indicator, setIndicator] = useState<DropIndicator | null>(null);
  const [allowed, setAllowed] = useState(true);

  const candidateFor = useCallback(
    (key: NodeKey) => buildCandidate(controller.store.get().doc, domMap, key),
    [controller, domMap],
  );

  const hitTest = useCallback(
    (x: number, y: number): NodeKey | null => {
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
    },
    [domMap],
  );

  useEffect(() => {
    const start = (event: Event) => {
      const detail = (event as CustomEvent<DragStartDetail>).detail;
      setDrag(detail);
      setIndicator(null);
      setAllowed(false);
    };
    window.addEventListener(START_EVENT, start);
    return () => window.removeEventListener(START_EVENT, start);
  }, []);

  useEffect(() => {
    if (!drag) return;
    const move = (event: PointerEvent) => {
      if (event.pointerId !== drag.pointerId) return;
      const doc = controller.store.get().doc;
      const dragged = drag.payload.kind === "move" ? findNode(doc, drag.payload.key) : null;
      const childTag =
        drag.payload.kind === "new"
          ? drag.payload.tag
          : dragged?.kind === "element"
            ? dragged.tag
            : null;
      const hit = hitTest(event.clientX, event.clientY);
      const decision =
        childTag && hit ? computeDrop(event, candidateFor(hit), childTag, canContain) : null;
      const invalidMove =
        decision &&
        drag.payload.kind === "move" &&
        (decision.parentKey === drag.payload.key ||
          findNode(dragged!, decision.parentKey) !== null);
      const wrapper = wrapperRef.current;
      const target = decision ? domMap?.byKey.get(decision.targetKey) : null;
      if (!decision || invalidMove || !wrapper || !target) {
        setIndicator(null);
        setAllowed(false);
        return;
      }
      const outer = wrapper.getBoundingClientRect();
      const rect = target.getBoundingClientRect();
      setAllowed(true);
      setIndicator({
        ...decision,
        rect: {
          left: rect.left - outer.left + wrapper.scrollLeft,
          top: rect.top - outer.top + wrapper.scrollTop,
          width: rect.width,
          height: rect.height,
        },
      });
    };
    const finish = (event: PointerEvent) => {
      if (event.pointerId !== drag.pointerId) return;
      if (indicator) {
        if (drag.payload.kind === "new") {
          const node = drag.payload.template();
          controller.commit((doc) => insertChild(doc, indicator.parentKey, node, indicator.index));
          controller.select(node.key);
        } else {
          const key = drag.payload.key;
          controller.commit((doc) => moveNode(doc, key, indicator.parentKey, indicator.index));
          controller.select(key);
        }
      }
      setDrag(null);
      setIndicator(null);
    };
    const clear = () => {
      setDrag(null);
      setIndicator(null);
    };
    const cancel = (event: KeyboardEvent) => {
      if (event.key === "Escape") clear();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", clear);
    window.addEventListener("keydown", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", clear);
      window.removeEventListener("keydown", cancel);
    };
  }, [candidateFor, controller, domMap, drag, hitTest, indicator, wrapperRef]);

  return { dragging: drag !== null, allowed, indicator };
}

function findKeyAtPath(root: ElementNode, path: readonly number[]): NodeKey | null {
  let node = root;
  for (const index of path) {
    const child = node.children[index];
    if (child?.kind !== "element") return null;
    node = child;
  }
  return node.key;
}

function buildCandidate(doc: EditorDoc, domMap: DomMap | null, key: NodeKey): DropCandidate | null {
  const node = findNode(doc, key);
  const element = domMap?.byKey.get(key);
  if (node?.kind !== "element" || !element) return null;
  const path = findPath(doc, key);
  const parentKey = path && path.length > 0 ? findKeyAtPath(doc, path.slice(0, -1)) : null;
  return {
    key,
    tag: node.tag,
    rect: element.getBoundingClientRect(),
    index: path?.at(-1) ?? 0,
    childCount: node.children.length,
    parent: parentKey ? buildCandidate(doc, domMap, parentKey) : null,
  };
}
