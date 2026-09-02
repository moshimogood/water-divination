/**
 * Per-member series colors, indexed by member position (mod length).
 * Shared by the team page chart and the OGP image so they stay in sync.
 * Chosen for solid contrast on a white background.
 */
export const MEMBER_PALETTE = [
  "#2563eb",
  "#db2777",
  "#059669",
  "#d97706",
  "#7c3aed",
  "#dc2626",
  "#0891b2",
  "#65a30d",
  "#c2410c",
  "#4f46e5",
] as const;
