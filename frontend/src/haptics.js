export function buzz(ms = 8) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms)
  } catch {
    // haptics are best-effort
  }
}
