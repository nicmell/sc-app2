import type { EditorController } from "@/lib/editor/EditorController";
import { PreviewHost } from "./PreviewHost";
import styles from "./Canvas.module.scss";

export interface CanvasProps {
  controller: EditorController;
}

export function Canvas({ controller }: CanvasProps) {
  return (
    <div className={styles.canvas}>
      <PreviewHost controller={controller} />
    </div>
  );
}
