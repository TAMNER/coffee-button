/** What the install wording needs to know about this browser (src/domain/install-copy.ts decides the words). */
import { isIosSafari, type BrowserFacts } from "../domain/install-copy";

export function browserFacts(): BrowserFacts {
  return { iosSafari: isIosSafari(navigator.userAgent, navigator.maxTouchPoints ?? 0) };
}
