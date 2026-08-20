import { beforeAll, describe, expect, it } from "vitest";
import { isParentRuntime } from "@/lib/utils/guards";
import { parsePlugin, wrapXml } from "@/lib/utils/test/test-utils";
import { registerScElements, type ScElement, type ScPlugin } from "@/sc-elements";

beforeAll(() => {
  registerScElements();
});

function orderedIds(host: ScPlugin): string[] {
  const ids: string[] = [];
  const visit = (el: ScElement): void => {
    ids.push(el.id);
    if (isParentRuntime(el)) for (const child of el._scChildren) visit(child);
  };
  visit(host);
  return ids;
}

const idsOf = (markup: string) => orderedIds(parsePlugin(wrapXml(markup)).host);
const idOf = (markup: string, selector: string) =>
  (parsePlugin(wrapXml(markup)).host.querySelector(selector) as ScElement).id;

describe("content-hash element ids", () => {
  it("mints identical ordered ids for two fresh hosts", () => {
    const xml = wrapXml(`
      <sc-group name="voice">
        <sc-display value="440"/>
        <sc-text>Frequency</sc-text>
      </sc-group>
    `);
    const first = orderedIds(parsePlugin(xml).host);
    const second = orderedIds(parsePlugin(xml).host);

    expect(first).toEqual(second);
  });

  it("pins the id scheme itself — exact ids for a known fixture", () => {
    // Cross-VERSION stability gate: these literals are the contract. An
    // engine change that shifts ANY minted id (hash input, cursor position,
    // chaining) must fail here and consciously update the pins.
    const ids = idsOf(`
      <sc-group name="voice">
        <sc-display value="440"/>
      </sc-group>
      <sc-display value="440"/>
    `);
    expect(ids).toEqual(["1bc7d76dafaf04", "15a4cac0dc1f24", "1bc3a18fcf53d1", "126a1257cba237"]);
  });

  it("gives identical twin siblings different ids", () => {
    const { host } = parsePlugin(wrapXml(`<sc-display value="a"/><sc-display value="a"/>`));
    const [first, second] = Array.from(host.querySelectorAll("sc-display"));

    expect(first.id).not.toBe(second.id);
  });

  it("gives identical elements in different scopes different ids", () => {
    const { host } = parsePlugin(
      wrapXml(`
        <sc-group name="left"><sc-var name="value" value="a"/></sc-group>
        <sc-group name="right"><sc-var name="value" value="a"/></sc-group>
      `),
    );
    const [first, second] = Array.from(host.querySelectorAll("sc-var"));

    expect(first.id).not.toBe(second.id);
  });

  it("uses bare hex ids throughout the ordered tree", () => {
    const { host } = parsePlugin(
      wrapXml(`<sc-group name="voice"><sc-text>root child</sc-text></sc-group>`),
    );
    const ids = orderedIds(host);

    expect(host.id).toMatch(/^[0-9a-f]+$/);
    expect(ids.every((id) => /^[0-9a-f]+$/.test(id))).toBe(true);
    expect(ids.every((id) => !id.includes("@"))).toBe(true);
  });

  it("changes ids for spec values, binds, parent attrs, and earlier siblings", () => {
    expect(idOf(`<sc-display value="1"/>`, "sc-display")).not.toBe(
      idOf(`<sc-display value="2"/>`, "sc-display"),
    );
    expect(idOf(`<sc-var name="a" value="1"/><sc-display bind:value="a"/>`, "sc-display")).not.toBe(
      idOf(`<sc-var name="a" value="1"/><sc-display bind:value="a + 1"/>`, "sc-display"),
    );

    const parentBefore = idsOf(`
      <sc-group name="voice">
        <sc-display value="1"/>
        <sc-text>copy</sc-text>
      </sc-group>
    `);
    const parentAfter = idsOf(`
      <sc-group name="other">
        <sc-display value="1"/>
        <sc-text>copy</sc-text>
      </sc-group>
    `);
    expect(parentBefore[1]).not.toBe(parentAfter[1]);
    expect(parentBefore.slice(2).every((id, index) => id !== parentAfter[index + 2])).toBe(true);

    const siblingsBefore = idsOf(`<sc-display value="a"/><sc-display value="b"/>`);
    const siblingsAfter = idsOf(
      `<sc-text>earlier</sc-text><sc-display value="a"/><sc-display value="b"/>`,
    );
    expect(siblingsAfter[1]).not.toBe(siblingsBefore[0]);
    expect(siblingsAfter[2]).not.toBe(siblingsBefore[1]);
  });

  it("ignores common attrs, ordering, whitespace, text, and child changes for parents", () => {
    const plain = idsOf(`<sc-display value="1" format="0.0"/>`);
    expect(
      idsOf(`<sc-display title="ignored" class="also-ignored" format="0.0" value="1"/>`),
    ).toEqual(plain);
    expect(idsOf(`<sc-display format="0.0" value="1"/>`)).toEqual(plain);

    const compact = idsOf(`<sc-display value="1"/><sc-text>two</sc-text>`);
    expect(
      idsOf(`
        <sc-display value="1"/>

        <sc-text>two</sc-text>
      `),
    ).toEqual(compact);
    expect(idsOf(`<sc-text>one</sc-text>`)).toEqual(idsOf(`<sc-text>two</sc-text>`));

    const childBefore = idsOf(`<sc-group name="voice"><sc-display value="1"/></sc-group>`);
    const childAfter = idsOf(`<sc-group name="voice"><sc-display value="2"/></sc-group>`);
    expect(childAfter[0]).toBe(childBefore[0]);
    expect(childAfter[1]).toBe(childBefore[1]);
    expect(childAfter[2]).not.toBe(childBefore[2]);
  });
});
