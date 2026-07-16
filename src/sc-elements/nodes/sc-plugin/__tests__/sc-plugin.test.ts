// The <sc-plugin> boot seam for the editor preview: the `source` property
// feeds entry markup directly (no stores/HTTP), and boot completion — success
// or failure — dispatches the non-bubbling "sc-boot" event whose detail
// carries the error (null on success). Driven through the REAL boot path
// (append → firstUpdated), against the scripted scsynth mock.

import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { OSC } from "@sc-app/server-commands";
import { registerScElements, type ScPlugin } from "@/sc-elements";
import { installScsynthMock, wrapXml } from "@/lib/utils/test/test-utils";

let sent: OSC.Message[];

beforeAll(() => {
  registerScElements();
});

beforeEach(() => {
  ({ sent } = installScsynthMock());
});

afterEach(() => {
  document.body.replaceChildren();
});

/** Mount a host with `source` set and await its boot completion event. */
async function bootWithSource(source: string): Promise<{ host: ScPlugin; error: string | null }> {
  const host = document.createElement("sc-plugin") as ScPlugin;
  host.id = `editor-${Math.random().toString(36).slice(2)}`;
  host.source = source;
  const booted = new Promise<string | null>((resolve) => {
    host.addEventListener("sc-boot", (e) => resolve((e as CustomEvent<{ error: string | null }>).detail.error), {
      once: true,
    });
  });
  document.body.appendChild(host);
  return { host, error: await booted };
}

describe("sc-plugin source boot", () => {
  it("boots from the source markup without stores or HTTP and reports success", async () => {
    const { host, error } = await bootWithSource(wrapXml(`<sc-var name="a" value="1"/>`));
    expect(error).toBeNull();
    expect(host.parsed).toBe(true);
    expect(host.loaded).toBe(true);
    expect(host.querySelector("sc-var")).not.toBeNull();
    expect(sent.map((m) => m.address)).toEqual(["/g_new"]); // the load pass ran
  });

  it("reports an XML parse failure through sc-boot and the error box", async () => {
    const { host, error } = await bootWithSource("<sc-plugin><oops></sc-plugin>");
    expect(error).toContain("not valid XHTML");
    expect(host._error).toBe(error);
    expect(host.parsed).toBe(false);
  });

  it("reports a runtime validation failure with the pointed parse-engine message", async () => {
    const { host, error } = await bootWithSource(wrapXml(`<sc-var name="a" value="1" bogus="x"/>`));
    expect(error).toContain('unknown attribute "bogus"');
    expect(host.parsed).toBe(false);
  });
});
