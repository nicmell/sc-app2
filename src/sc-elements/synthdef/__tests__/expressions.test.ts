// Expression graph inputs: a ugen control's bind:value can be arithmetic
// (`freq * 2`, `peak * sustain`) that lowers to BinaryOpUGen/UnaryOpUGen nodes.
// Parse-only — operand existence + declared-before-referenced are enforced at
// parse (ScUgen.resolveRuntime → resolveNode over each operand path); the
// lowering itself is compiled here through compileSynthDef.

import { beforeAll, describe, expect, it } from "vitest";

import { registerScElements, type ScSynthDef } from "@/sc-elements";
import { compileSynthDef } from "@/lib/synthdef/compileSynthDef";
import { parsePlugin, wrapXml } from "@/lib/utils/test/test-utils";

const synthdef = (oscFreqBind: string, extra = ""): string =>
  wrapXml(`<sc-synthdef name="d">
    <sc-control name="freq" value="440"/>
    <sc-ugen name="osc" type="SinOsc"><sc-control name="freq" bind:value="${oscFreqBind}"/></sc-ugen>
    ${extra}
    <sc-ugen name="out" type="Out">
      <sc-control name="bus" value="0"/><sc-control name="channelsarray" bind:value="osc,osc"/>
    </sc-ugen>
  </sc-synthdef>`);

const compileFirst = (host: { querySelector(sel: string): Element | null }) => {
  const def = host.querySelector("sc-synthdef") as unknown as ScSynthDef;
  return () => compileSynthDef(def.getProp("name") as string, def.params, def.specs);
};

beforeAll(() => registerScElements());

describe("expression graph inputs", () => {
  it("parses + compiles an arithmetic input referencing a param", () => {
    const { host } = parsePlugin(synthdef("freq * 2 + 10"));
    expect(compileFirst(host)).not.toThrow();
  });

  it("rejects an operand that names nothing in scope", () => {
    expect(() => parsePlugin(synthdef("undeclared * 2"))).toThrow(
      'input "freq" references unknown "undeclared"',
    );
  });

  it("rejects an operand referenced before it is declared", () => {
    // `osc` binds `later`, a ugen declared AFTER it — a forward reference.
    expect(() =>
      parsePlugin(synthdef("later * 2", `<sc-ugen name="later" type="SinOsc"><sc-control name="freq" value="1"/></sc-ugen>`)),
    ).toThrow(/"later" is referenced before it is declared/);
  });
});
