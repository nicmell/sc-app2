import { Progress } from "@/components/ui";
import styles from "./LoadingOverlay.module.scss";

/** A full-window scrim with an indeterminate loading bar — any blocking wait
 *  (route loaders booting the app, the session connecting). `label` is the
 *  progress bar's accessible name. */
export function LoadingOverlay({ label }: { label: string }) {
  return (
    <div className={styles.backdrop}>
      <div className={styles.loader}>
        <Progress label={label} />
      </div>
    </div>
  );
}
