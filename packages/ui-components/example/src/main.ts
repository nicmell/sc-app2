// Showcase entry. Adopt the foundation onto the document (the shared CSSResult sheet
// — also where the Phosphor @font-face is registered) so the demo chrome + light DOM
// get the tokens; components additionally adopt it into their own shadow roots. Then
// define every <sc-*-base> custom element. Consumes the BUILT package.
import { registerUiComponents, adoptFoundation } from "@sc-app/ui-components/lit";

adoptFoundation();
registerUiComponents();
