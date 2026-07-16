import { ELEMENTS } from "@/constants/sc-elements";
import "react";

export type ScElementTagNames = (typeof ELEMENTS)[keyof typeof ELEMENTS];

interface ScElementHTMLAttributes extends React.HTMLAttributes<HTMLElement> {
  name?: string;
}

/** The host-only properties (JS properties, not attributes) exist solely on
 *  <sc-plugin> — typing them on every sc-* tag would let a stray attribute
 *  typecheck and then die in validateProps at parse. `plugin` resolves a
 *  stored plugin id; `source` feeds entry markup directly (editor preview). */
interface ScPluginHTMLAttributes extends ScElementHTMLAttributes {
  plugin?: string;
  source?: string;
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
