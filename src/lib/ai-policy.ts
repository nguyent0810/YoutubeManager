/** Pure gate: all three conditions required before calling Gemini. */
export function isAiFullyEnabled(state: {
  configured: boolean
  orgEnabled: boolean
  userOptIn: boolean
}): boolean {
  return state.configured && state.orgEnabled && state.userOptIn
}
