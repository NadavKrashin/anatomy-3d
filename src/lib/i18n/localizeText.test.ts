import { describe, expect, it } from "vitest";
import { localizeText } from "./localizeText";

describe("localizeText", () => {
  it("uses Hebrew when available and the UI is Hebrew", () => {
    expect(localizeText({ en: "Heart", he: "לב" }, "he")).toEqual({
      text: "לב",
      language: "he",
      dir: "rtl",
    });
  });

  it("falls back to English", () => {
    expect(localizeText({ en: "Heart" }, "he")).toEqual({
      text: "Heart",
      language: "en",
      dir: "ltr",
    });
    expect(localizeText({ en: "Heart", he: "לב" }, "en")).toMatchObject({
      text: "Heart",
    });
  });
});
