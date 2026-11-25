import { describe, expect, it } from "vitest";
import { readFile } from "./read-file";

const SCRIPT = "INT. HOUSE - DAY\n\nANNA\nHello.";
const file = (name: string, content: BlobPart, type = "") => new File([content], name, { type });

describe("readFile", () => {
  it("accepts Fountain extensions, whatever the MIME type", async () => {
    // Android usually reports .fountain as application/octet-stream.
    await expect(readFile(file("draft.fountain", SCRIPT, "application/octet-stream"))).resolves.toMatchObject({
      name: "draft.fountain",
      text: SCRIPT,
    });
    await expect(readFile(file("DRAFT.SPMD", SCRIPT))).resolves.toMatchObject({ name: "DRAFT.SPMD" });
  });

  it("accepts extension-less text files and names them .fountain", async () => {
    await expect(readFile(file("My Script", SCRIPT))).resolves.toMatchObject({ name: "My Script.fountain", text: SCRIPT });
  });

  it("accepts text/* files with another extension", async () => {
    await expect(readFile(file("draft.md", SCRIPT, "text/markdown"))).resolves.toMatchObject({ name: "draft.md" });
  });

  it("rejects binary files", async () => {
    await expect(readFile(file("photo.jpg", new Uint8Array([0xff, 0xd8, 0xff]), "image/jpeg"))).rejects.toMatchObject({
      code: "unsupported_file",
    });
    await expect(readFile(file("blob", new Uint8Array([0x00, 0xc3, 0x28])))).rejects.toMatchObject({ code: "unsupported_file" });
  });

  it("flags non-UTF-8 Fountain files as lossy instead of rejecting them", async () => {
    await expect(readFile(file("old.fountain", new Uint8Array([0x43, 0x61, 0x66, 0xe9])))).resolves.toMatchObject({
      text: "Café",
      lossyDecode: true,
    });
  });
});
