import { describe, expect, it } from "vitest";
import { drawingRequestLink } from "./drawing-request";

describe("drawing request link (ticket 38)", () => {
  it("a mailto destination gets the subject and a body naming the item, percent-encoded", () => {
    expect(drawingRequestLink("mailto:drawings@example.invalid", "Matcha")).toBe(
      "mailto:drawings@example.invalid?subject=Coffee%20Button%20drawing%20request&body=I'd%20like%20a%20drawing%20for%3A%20Matcha",
    );
  });
});
