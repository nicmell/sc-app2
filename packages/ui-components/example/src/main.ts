// Showcase entry. The full foundation is loaded as a render-blocking <link> in index.html
// (styled at first paint, registers the Phosphor @font-face document-wide) — NOT imported
// here, so there's no dev FOUC. This entry only registers the <sc-base-*> custom elements.
import { registerUiComponents } from "@sc-app/ui-components/lit";

registerUiComponents();
