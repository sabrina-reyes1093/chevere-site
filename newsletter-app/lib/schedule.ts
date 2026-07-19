const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function chicagoParts(date: Date) {
  return Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
}

export function isFridaySendWindow(date: Date) {
  const parts = chicagoParts(date);
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  return parts.weekday === "Fri" && minutes >= 510 && minutes <= 630;
}

export function nextFridayAt830Chicago(from = new Date()) {
  const cursor = new Date(from.getTime() + 60_000);
  cursor.setUTCSeconds(0, 0);
  for (let i = 0; i < 60 * 24 * 9; i += 1) {
    const parts = chicagoParts(cursor);
    if (parts.weekday === "Fri" && parts.hour === "08" && parts.minute === "30") return cursor;
    cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);
  }
  throw new Error("Could not calculate the next Friday delivery time.");
}
