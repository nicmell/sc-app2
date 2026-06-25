// Showcase entry. The full foundation goes in the document <head> as a render-blocking
// stylesheet (a side-effect import Vite extracts to a <link> in the build) — it styles
// the demo chrome + light DOM and registers the Phosphor @font-face document-wide.
// Shadow components adopt only a font-free subset via `static styles`. Then define every
// <sc-*-base> custom element.
import "@sc-app/ui-components";
import { registerUiComponents } from "@sc-app/ui-components/lit";

registerUiComponents();
