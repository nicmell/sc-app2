import { describe, expect, it } from "vitest";
import { cmSchemaFromSpecs } from "../cmSchema";

describe("cmSchemaFromSpecs", () => {
  const schema = cmSchemaFromSpecs();

  it("derives allowed children", () => {
    expect(schema.elements.find((element) => element.name === "sc-row")?.children).toEqual([
      "sc-col",
    ]);
  });

  it("adds runtime binding siblings", () => {
    const names = schema.elements
      .find((element) => element.name === "sc-slider")
      ?.attributes.map((attribute) => attribute.name);
    expect(names).toContain("value");
    expect(names).toContain("bind:value");
  });

  it("preserves enum values", () => {
    const enumAttribute = schema.elements
      .flatMap((element) => element.attributes)
      .find((attribute) => attribute.values !== undefined);
    expect(enumAttribute).toBeDefined();
    expect(enumAttribute?.values).toBeTruthy();
  });
});
