import { Progress } from "@/components/ui";
import styles from "./ConnectionOverlay.module.scss";

export function ConnectingScreen() {
  return (
    <div className={styles.backdrop}>
      <div className={styles.loader}>
        <Progress label="Connecting to the session…" />
      </div>
    </div>
  );
}
