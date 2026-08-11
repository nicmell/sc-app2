import { beforeAll, describe, expect, it } from "vitest";
import { parsePlugin, wrapXml } from "@/lib/utils/test/test-utils";
import { registerScElements, type ScElement, type ScPlugin } from "@/sc-elements";

beforeAll(() => {
  registerScElements();
});

const parts = (id: string) => {
  const split = id.lastIndexOf("@");
  return { hash: id.slice(0, split), ordinal: id.slice(split + 1) };
};

function orderedIds(host: ScPlugin): string[] {
  const ids: string[] = [];
  const visit = (el: ScElement): void => {
    ids.push(el.id);
    for (const child of el._scChildren ?? []) visit(child);
  };
  visit(host);
  return ids;
}

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
    expect(first.every((id) => /^[0-9a-f]+@\d+$/.test(id))).toBe(true);
    expect(first[0]).toMatch(/@0$/);
  });

  it("gives identical twin siblings one hash and distinct ordinals", () => {
    const { host } = parsePlugin(
      wrapXml(`<sc-display value="a"/><sc-display value="a"/>`),
    );
    const [first, second] = Array.from(host.querySelectorAll("sc-display"));
    const a = parts(first.id);
    const b = parts(second.id);

    expect(a.hash).toBe(b.hash);
    expect(a.ordinal).not.toBe(b.ordinal);
  });

  it("keeps identical cross-scope elements hash-equal but fully unique", () => {
    const { host } = parsePlugin(
      wrapXml(`
        <sc-group name="left"><sc-display value="a"/></sc-group>
        <sc-group name="right"><sc-display value="a"/></sc-group>
      `),
    );
    const [first, second] = Array.from(host.querySelectorAll("sc-display"));

    expect(parts(first.id).hash).toBe(parts(second.id).hash);
    expect(first.id).not.toBe(second.id);
  });

  it("mints the root from its content hash at ordinal zero", () => {
    const { host } = parsePlugin(wrapXml(`<sc-text>root child</sc-text>`));
    const before = host.id;
    const sameContent = parsePlugin(
      wrapXml(`<sc-text>root child</sc-text>`).replace("<sc-plugin ", '<sc-plugin id="authored" '),
    ).host;

    expect(before).toMatch(/^[0-9a-f]+@0$/);
    expect(sameContent.id).toBe(before);
  });

  it("honors the serialization sensitivity and insensitivity matrix", () => {
    expect(parts(idOf(`<sc-display value="1"/>`, "sc-display")).hash).not.toBe(
      parts(idOf(`<sc-display value="2"/>`, "sc-display")).hash,
    );
    expect(
      parts(idOf(`<sc-var name="a" value="1"/><sc-display bind:value="a"/>`, "sc-display"))
        .hash,
    ).not.toBe(
      parts(
        idOf(`<sc-var name="a" value="1"/><sc-display bind:value="a + 1"/>`, "sc-display"),
      ).hash,
    );
    expect(parsePlugin(wrapXml(`<sc-text>one</sc-text>`)).host.id).not.toBe(
      parsePlugin(wrapXml(`<sc-text>one</sc-text><sc-text>two</sc-text>`)).host.id,
    );
    expect(parts(idOf(`<sc-text>one</sc-text>`, "sc-text")).hash).not.toBe(
      parts(idOf(`<sc-text>two</sc-text>`, "sc-text")).hash,
    );

    const plain = parts(idOf(`<sc-display value="1" format="0.0"/>`, "sc-display")).hash;
    expect(
      parts(
        idOf(
          `<sc-display title="ignored" class="also-ignored" format="0.0" value="1"/>`,
          "sc-display",
        ),
      ).hash,
    ).toBe(plain);
    expect(
      parsePlugin(wrapXml(`<sc-display value="1"/><sc-text>two</sc-text>`)).host.id,
    ).toBe(
      parsePlugin(
        wrapXml(`
          <sc-display value="1"/>

          <sc-text>two</sc-text>
        `),
      ).host.id,
    );
  });
});
