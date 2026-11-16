import { describe, expect, it } from "vitest";
import { SampleLoader, latePourSeconds } from "./samples";

/** A decode that the test finishes by hand, so "still loading" is a real state. */
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

const FILES = { pour: ["sounds/pour.m4a", "sounds/pour.mp3"], cheer: ["sounds/cheer.m4a"] };

describe("SampleLoader", () => {
  it("a sample asked for while it is still decoding arrives when the decode finishes", async () => {
    const decoding = deferred<string>();
    const loader = new SampleLoader<string>(
      FILES,
      async () => new ArrayBuffer(1),
      () => decoding.promise,
    );
    loader.start();
    expect(loader.get("pour")).toBeUndefined();
    const waiting = loader.whenLoaded("pour");
    decoding.resolve("POUR");
    expect(await waiting).toBe("POUR");
    expect(loader.get("pour")).toBe("POUR");
  });

  it("start is idempotent: each file is fetched once however often it is called", async () => {
    const fetched: string[] = [];
    const loader = new SampleLoader<string>(
      FILES,
      async (file) => {
        fetched.push(file);
        return new ArrayBuffer(1);
      },
      async () => "x",
    );
    loader.start();
    loader.start();
    await loader.whenLoaded("pour");
    await loader.whenLoaded("cheer");
    expect(fetched).toEqual(["sounds/pour.m4a", "sounds/cheer.m4a"]);
  });

  it("falls through to the next format when a file is missing or will not decode", async () => {
    const loader = new SampleLoader<string>(
      FILES,
      async (file) => (file.endsWith(".m4a") ? undefined : new ArrayBuffer(1)),
      async () => "MP3",
    );
    loader.start();
    expect(await loader.whenLoaded("pour")).toBe("MP3");
    expect(await loader.whenLoaded("cheer")).toBeUndefined();
  });

  it("a decode that throws leaves the sample missing and never rejects", async () => {
    const loader = new SampleLoader<string>(
      { pour: ["sounds/pour.m4a"] },
      async () => new ArrayBuffer(1),
      async () => {
        throw new Error("bad audio");
      },
    );
    loader.start();
    expect(await loader.whenLoaded("pour")).toBeUndefined();
    expect(loader.get("pour")).toBeUndefined();
  });

  it("whenLoaded before start resolves to nothing rather than hanging", async () => {
    const loader = new SampleLoader<string>(FILES, async () => new ArrayBuffer(1), async () => "x");
    expect(await loader.whenLoaded("pour")).toBeUndefined();
  });
});

describe("latePourSeconds", () => {
  it("plays what is left of the pour when the recording arrives late", () => {
    expect(latePourSeconds(800, 300)).toBeCloseTo(0.5);
  });

  it("stays silent when too little of the pour is left to be worth starting", () => {
    expect(latePourSeconds(800, 700)).toBeNull();
    expect(latePourSeconds(800, 900)).toBeNull();
  });
});
