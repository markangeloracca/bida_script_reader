import "fake-indexeddb/auto";
import { createStore } from "idb-keyval";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDocumentRepository, createHandleRepository, createRecentsRepository } from "./repositories";
import { createScriptService, MAX_RECENTS, type ScriptService } from "./script-service";
import { summarizeScript } from "./index";
import type { FileAccess } from "./types";

let counter = 0;

function setup(files: Partial<FileAccess> = {}) {
  const suffix = String(++counter);
  let clock = 1000;
  const service = createScriptService({
    recents: createRecentsRepository(createStore(`recents-${suffix}`, "s")),
    documents: createDocumentRepository(createStore(`documents-${suffix}`, "s")),
    handles: createHandleRepository(createStore(`handles-${suffix}`, "s")),
    files: { open: async () => null, saveAs: async (_text, name) => ({ fileName: name }), ...files },
    summarize: summarizeScript,
    now: () => ++clock,
  });
  return service;
}

describe("ScriptService", () => {
  let service: ScriptService;
  beforeEach(() => {
    service = setup();
  });

  it("imports a file and lists it as recent", async () => {
    const entry = await service.importFile({ name: "draft.fountain", text: "Title: Big Fish\n\nINT. HOUSE - DAY", sizeBytes: 10 });
    expect(entry).toMatchObject({ title: "Big Fish", fileName: "draft.fountain", pageCount: 1, hasHandle: false });
    expect((await service.listRecents()).map((r) => r.id)).toEqual([entry.id]);
    expect((await service.load(entry.id))?.text).toContain("INT. HOUSE");
  });

  it("does not duplicate a file opened twice", async () => {
    const a = await service.importFile({ name: "a.fountain", text: "One", sizeBytes: 3 });
    const b = await service.importFile({ name: "a.fountain", text: "Two", sizeBytes: 3 });
    expect(b.id).toBe(a.id);
    expect(await service.listRecents()).toHaveLength(1);
    expect((await service.load(a.id))?.text).toBe("Two");
  });

  it("orders recents by last opened and caps the list", async () => {
    for (let i = 0; i < MAX_RECENTS + 3; i++) await service.createScript(`Script ${i}`, `s${i}.fountain`);
    const list = await service.listRecents();
    expect(list).toHaveLength(MAX_RECENTS);
    expect(list[0].fileName).toBe(`s${MAX_RECENTS + 2}.fountain`);
  });

  it("autosaves text and updates the summary", async () => {
    const entry = await service.createScript("", "untitled.fountain");
    const updated = await service.autosave(entry.id, "Title: New Name\n\nAction.");
    expect(updated.title).toBe("New Name");
    expect(updated.lastEditedAt).toBeGreaterThan(entry.lastEditedAt);
  });

  it("removes a recent with its snapshot", async () => {
    const entry = await service.createScript("Text", "x.fountain");
    await service.removeRecent(entry.id);
    expect(await service.load(entry.id)).toBeNull();
  });

  it("saves through the fallback saver when there is no handle", async () => {
    const saveAs = vi.fn(async (_text: string, name: string) => ({ fileName: name }));
    const local = setup({ saveAs });
    const entry = await local.createScript("Text", "x.fountain");
    await expect(local.save(entry.id, "New text")).resolves.toEqual({ target: "download", fileName: "x.fountain" });
    expect(saveAs).toHaveBeenCalledWith("New text", "x.fountain");
  });

  it("reports cancelled saves as null", async () => {
    const local = setup({ saveAs: async () => null });
    const entry = await local.createScript("Text", "x.fountain");
    await expect(local.save(entry.id, "Text")).resolves.toBeNull();
  });

  it("throws a typed error for unknown scripts", async () => {
    await expect(service.autosave("missing", "x")).rejects.toMatchObject({ code: "not_found" });
  });
});
