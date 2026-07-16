import { allowedChildren } from "@/lib/editor/contentModel";
import { SPECS } from "@/sc-elements/internal/xsd/registry";
import { COMMON_ATTRS, bindAttr } from "@/sc-elements/internal/xsd/types";

export interface CmXmlAttributeSpec {
  name: string;
  values?: readonly string[];
}

export interface CmXmlElementSpec {
  name: string;
  children: readonly string[];
  attributes: readonly CmXmlAttributeSpec[];
}

export interface CmXmlSchema {
  elements: readonly CmXmlElementSpec[];
  attributes: readonly CmXmlAttributeSpec[];
}

let cachedSchema: CmXmlSchema | undefined;

export function cmSchemaFromSpecs(): CmXmlSchema {
  if (cachedSchema) return cachedSchema;

  const allAttributes = new Map<string, CmXmlAttributeSpec>();
  const elements = [...SPECS.values()].map((spec): CmXmlElementSpec => {
    const attributes: CmXmlAttributeSpec[] = [];

    for (const [name, attr] of Object.entries(spec.attrs ?? {})) {
      const attribute = attr.type === "enum" ? { name, values: attr.values } : { name };
      attributes.push(attribute);
      allAttributes.set(name, attribute);

      if (attr.runtime !== false) {
        const boundAttribute = { name: bindAttr(name) };
        attributes.push(boundAttribute);
        allAttributes.set(boundAttribute.name, boundAttribute);
      }
    }

    for (const name of COMMON_ATTRS) {
      const attribute = { name };
      attributes.push(attribute);
      allAttributes.set(name, attribute);
    }

    return {
      name: spec.tag,
      children: [...allowedChildren(spec.tag)],
      attributes,
    };
  });

  cachedSchema = { elements, attributes: [...allAttributes.values()] };
  return cachedSchema;
}
