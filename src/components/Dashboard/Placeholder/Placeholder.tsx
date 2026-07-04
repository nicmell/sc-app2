// An "add a panel here" target rendered as an absolutely-positioned overlay on
// top of the grid (NOT a grid child), sized to one empty rectangle. Clicking it
// opens the plugin picker, which drops a real box into that exact region.
import { Icon } from "@/components/ui";
import type { BoxItem } from "@/types/stores";
import { toPixelStyle } from "@/components/Dashboard/utils";
import styles from "./Placeholder.module.scss";

interface PlaceholderProps {
  item: BoxItem;
  containerWidth: number;
  cols: number;
  rowHeight: number;
  onClick: () => void;
}

export function Placeholder({ item, containerWidth, cols, rowHeight, onClick }: PlaceholderProps) {
  return (
    <div
      className={styles.placeholder}
      style={toPixelStyle(item, containerWidth, cols, rowHeight)}
      onClick={onClick}
    >
      <Icon name="plus" />
    </div>
  );
}
