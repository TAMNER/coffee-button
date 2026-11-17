export function formatPounds(pence: number): string {
  const pounds = Math.floor(pence / 100);
  const rest = String(pence % 100).padStart(2, "0");
  return `£${pounds}.${rest}`;
}

/** Ticket 33: the latte graph's labels keep pence only when there are any ("£28", "£381.30"). */
export function formatPoundsShort(pence: number): string {
  return pence % 100 === 0 ? `£${pence / 100}` : formatPounds(pence);
}
