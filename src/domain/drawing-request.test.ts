import { describe, expect, it } from "vitest";
import { drawingRequestLink } from "./drawing-request";

describe("drawing request link (ticket 38)", () => {
  it("a mailto destination gets the subject and a body naming the item, percent-encoded", () => {
    expect(drawingRequestLink("mailto:drawings@example.invalid", "Matcha")).toBe(
      "mailto:drawings@example.invalid?subject=Coffee%20Button%20drawing%20request&body=I'd%20like%20a%20drawing%20for%3A%20Matcha",
    );
  });

  it("a name with spaces, &, ?, £ or a newline survives into the body intact and splits no parameter", () => {
    for (const name of ["Bubble tea & cake", "What? Tea?", "£2 flapjack", "Iced\nlatte", "a=b&subject=x#frag"]) {
      const link = drawingRequestLink("mailto:drawings@example.invalid", name);
      const query = new URLSearchParams(link.slice(link.indexOf("?") + 1));
      expect([...query.keys()]).toEqual(["subject", "body"]);
      expect(query.get("subject")).toBe("Coffee Button drawing request");
      expect(query.get("body")).toBe(`I'd like a drawing for: ${name}`);
      expect(link).not.toContain(" ");
      expect(link).not.toContain("+");
    }
  });

  it("an empty or blank name box ends the body after the colon and a space; a typed name is trimmed", () => {
    const body = (name: string) => {
      const link = drawingRequestLink("mailto:drawings@example.invalid", name);
      return new URLSearchParams(link.slice(link.indexOf("?") + 1)).get("body");
    };
    expect(body("")).toBe("I'd like a drawing for: ");
    expect(body("   ")).toBe("I'd like a drawing for: ");
    expect(body("  Matcha  ")).toBe("I'd like a drawing for: Matcha");
  });

  it("an https destination is opened exactly as it is, with nothing appended", () => {
    const form = "https://forms.example.invalid/d/e/abc/viewform?usp=sf_link";
    expect(drawingRequestLink(form, "Bubble tea & cake")).toBe(form);
    expect(drawingRequestLink("https://example.invalid", "")).toBe("https://example.invalid");
  });
});
