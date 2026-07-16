/** Fast lexical validation used by the editor inspector. */

import type { ElementSpec } from "@/sc-elements/internal/xsd/types";
import type { ElementNode } from "./model";

export interface Issue {
  attr: string;
  message: string;
}

const XSD_DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
const XSD_INTEGER = /^[+-]?\d+$/;
const XSD_BOOLEAN = new Set(["true", "false", "1", "0"]);

export function validateAttrs(node: ElementNode, spec: ElementSpec): Issue[] {
  const issues: Issue[] = [];
  for (const [name, attr] of Object.entries(spec.attrs ?? {})) {
    const raw = node.attrs[name];
    const dynamic = attr.runtime !== false ? node.attrs[`bind:${name}`] : undefined;
    if (raw === undefined) {
      if (attr.required && dynamic === undefined) {
        issues.push({ attr: name, message: `Missing required "${name}" attribute` });
      }
      continue;
    }
    if (attr.type === "decimal" && !XSD_DECIMAL.test(raw)) {
      issues.push({ attr: name, message: `"${name}" must be a decimal number` });
    } else if (attr.type === "integer" && !XSD_INTEGER.test(raw)) {
      issues.push({ attr: name, message: `"${name}" must be an integer` });
    } else if (attr.type === "boolean" && !XSD_BOOLEAN.has(raw)) {
      issues.push({ attr: name, message: `"${name}" must be one of true|false|1|0` });
    } else if (attr.type === "enum" && !attr.values.includes(raw)) {
      issues.push({ attr: name, message: `"${name}" must be one of ${attr.values.join("|")}` });
    }
  }
  return issues;
}
