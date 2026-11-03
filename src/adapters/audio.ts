export interface Audio {
  /** A short synthesised coin clink. */
  playCoin(): void;
}

/** For tests: counts calls; set `fail` to make it throw. */
export class FakeAudio implements Audio {
  coins = 0;
  fail = false;
  playCoin(): void {
    this.coins++;
    if (this.fail) throw new Error("audio unavailable");
  }
}
