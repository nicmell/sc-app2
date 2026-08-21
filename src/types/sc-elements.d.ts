import { ELEMENTS } from "@/constants/sc-elements";
import "react";

export type ScElementTagNames = (typeof ELEMENTS)[keyof typeof ELEMENTS];

interface ScElementHTMLAttributes extends React.HTMLAttributes<HTMLElement> {
  name?: string;
}

/** The host-only plugin-id property (a JS property, not an attribute) exists
 *  solely on <sc-plugin> — typing it on every sc-* tag would let a stray
 *  `plugin` attribute typecheck and then fail the shared static gate at parse. */
interface ScPluginHTMLAttributes extends ScElementHTMLAttributes {
  plugin?: string;
}

type ScElementIntrinsicElements = {
  [K in ScElementTagNames]: React.DetailedHTMLProps<
    K extends "sc-plugin" ? ScPluginHTMLAttributes : ScElementHTMLAttributes,
    HTMLElement
  >;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends ScElementIntrinsicElements {}
  }
}
