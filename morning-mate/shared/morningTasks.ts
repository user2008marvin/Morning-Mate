export const MORNING_TASKS = [
  { label: "WAKE UP!",        emoji: "☀️", sticker: "⭐" },
  { label: "BRUSH TEETH!",    emoji: "🪥", sticker: "✨" },
  { label: "WASH YOUR FACE!", emoji: "🧼", sticker: "🌟" },
  { label: "GET DRESSED!",    emoji: "👕", sticker: "🌈" },
  { label: "PUT ON SHOES!",   emoji: "👟", sticker: "💫" },
  { label: "LET'S GO!",       emoji: "🚀", sticker: "🏆" },
] as const;

export type MorningTask = typeof MORNING_TASKS[number];
