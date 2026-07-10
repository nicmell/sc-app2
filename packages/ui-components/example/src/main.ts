// Showcase entry. The full foundation goes in the document <head> as a render-blocking
// stylesheet (a side-effect import Vite extracts to a <link> in the build) — it styles
// the demo chrome + light DOM and registers the Phosphor @font-face document-wide.
// Shadow components adopt only a font-free subset via `static styles`. Then define every
// <sc-*-base> custom element.
import "@sc-app/ui-components";
import { LitElement, css, html } from "lit";
import { registerUiComponents, scColLayoutStyles } from "@sc-app/ui-components/lit";

registerUiComponents();

/** Reproduces ScElement's light-DOM default and its Lit-managed shadow opt-in. */
abstract class DemoScElement extends LitElement {
  createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  protected createShadowRenderRoot(): HTMLElement | DocumentFragment {
    return super.createRenderRoot();
  }
}

/** Reproduces the plugin wrappers' exact Shadow DOM and slot hierarchy. */
class DemoPluginRow extends DemoScElement {
  static styles = css`
    :host {
      display: block;
      min-width: 0;
    }
  `;

  createRenderRoot(): HTMLElement | DocumentFragment {
    return this.createShadowRenderRoot();
  }

  render() {
    return html`<sc-base-row gutter="md"><slot></slot></sc-base-row>`;
  }
}

class DemoPluginCol extends DemoScElement {
  static properties = {
    span: { type: Number, reflect: true },
  };

  static styles = scColLayoutStyles;

  declare span: number | undefined;

  createRenderRoot(): HTMLElement | DocumentFragment {
    return this.createShadowRenderRoot();
  }

  render() {
    return html`<sc-base-col flex="auto"><slot></slot></sc-base-col>`;
  }
}

customElements.define("demo-plugin-row", DemoPluginRow);
customElements.define("demo-plugin-col", DemoPluginCol);
