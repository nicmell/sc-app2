import { css } from "lit";

/** <sc-icon-base> glyph sizing/colour. The Phosphor glyph rules
 *  (.ph-fill/.ph-<name>) are adopted separately in the component, since the
 *  icon-font CSS doesn't cross the shadow boundary. */
export const iconStyles = css`
  :host {
    display: inline-flex;
  }
  .sc-icon {
    font-size: inherit;
    line-height: 1;
    color: inherit;
  }
  .sc-icon--sm {
    font-size: var(--font-size-xs);
  }
  .sc-icon--md {
    font-size: var(--font-size-sm);
  }
  .sc-icon--lg {
    font-size: var(--font-size-lg);
  }
`;
