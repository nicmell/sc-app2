import { css } from "lit";

/** The slice of the global reset that a shadow root needs (the document reset
 *  doesn't cross the boundary): border-box sizing + form controls inheriting the
 *  host font/colour. Composed into each shadow component's `static styles`. */
export const resetStyles = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  button,
  input,
  textarea,
  select {
    font: inherit;
    color: inherit;
  }
`;
