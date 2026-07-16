/** Pure drop-target geometry shared by canvas pointer interactions and tests. */

import type { NodeKey } from "./model";

export interface DropPoint {
  x: number;
  y: number;
}

export interface DropRect {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface DropCandidate {
  key: NodeKey;
  tag: string;
  rect: DropRect;
  parent?: DropCandidate | null;
  index: number;
  childCount: number;
}

export interface DropDecision {
  parentKey: NodeKey;
  index: number;
  position: "inside" | "before" | "after";
  targetKey: NodeKey;
}

export function computeDrop(
  point: DropPoint,
  target: DropCandidate | null,
  childTag: string,
  canContain: (parentTag: string, childTag: string) => boolean,
): DropDecision | null {
  let candidate = target;
  while (candidate) {
    const height = Math.max(0, candidate.rect.bottom - candidate.rect.top);
    const ratio = height === 0 ? 0.5 : (point.y - candidate.rect.top) / height;
    if (ratio >= 0.25 && ratio <= 0.75 && canContain(candidate.tag, childTag)) {
      return {
        parentKey: candidate.key,
        index: candidate.childCount,
        position: "inside",
        targetKey: candidate.key,
      };
    }
    const parent = candidate.parent;
    if (parent && canContain(parent.tag, childTag)) {
      const after = ratio > 0.75;
      if (ratio < 0.25 || after) {
        return {
          parentKey: parent.key,
          index: candidate.index + (after ? 1 : 0),
          position: after ? "after" : "before",
          targetKey: candidate.key,
        };
      }
    }
    candidate = parent ?? null;
  }
  return null;
}
