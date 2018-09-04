export function getTrackerColorString(tracker: any): string {
  const colorInt = tracker.color
  if (colorInt) {
    const alpha = (colorInt >> 24) & 0xFF
    const red = (colorInt >> 16) & 0xFF
    const green = (colorInt >> 8) & 0xFF
    const blue = (colorInt) & 0xFF
    return "rgba(" + red + "," + green + "," + blue + "," + (alpha / 255) + ")"
  } else { return "transparent" }
}