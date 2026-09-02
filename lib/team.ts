import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { FIVE_SYSTEMS, type Team, type TeamMember } from "@/lib/types";

export const TEAM_MAX_MEMBERS = 10;
export const NICKNAME_MAX_LENGTH = 15;
export const TEAM_DATA_VERSION = 1;

export function validateNickname(nickname: string): string | null {
  const trimmed = nickname.trim();
  if (trimmed.length === 0) return "ニックネームを入力してください";
  if (trimmed.length > NICKNAME_MAX_LENGTH) {
    return `ニックネームは${NICKNAME_MAX_LENGTH}文字以内で入力してください`;
  }
  return null;
}

export function encodeTeam(team: Team): string {
  return compressToEncodedURIComponent(JSON.stringify(team));
}

function isValidMember(member: unknown): member is TeamMember {
  if (typeof member !== "object" || member === null) return false;
  const m = member as Record<string, unknown>;
  if (typeof m.clientId !== "string" || m.clientId.length === 0) return false;
  if (typeof m.nickname !== "string") return false;
  if (typeof m.scores !== "object" || m.scores === null) return false;
  const scores = m.scores as Record<string, unknown>;
  return FIVE_SYSTEMS.every((s) => typeof scores[s] === "number");
}

export function decodeTeam(encoded: string): Team | null {
  if (!encoded) return null;
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null) return null;
    const team = parsed as Record<string, unknown>;
    if (typeof team.v !== "number" || !Array.isArray(team.members)) return null;
    if (!team.members.every(isValidMember)) return null;
    return { v: team.v, members: team.members };
  } catch {
    return null;
  }
}

/**
 * Adds a member, or overwrites the member with the same clientId
 * (re-diagnosis via a team link updates in place instead of appending).
 */
export function upsertMember(team: Team, member: TeamMember): Team {
  const index = team.members.findIndex((m) => m.clientId === member.clientId);
  if (index >= 0) {
    const members = [...team.members];
    members[index] = member;
    return { ...team, members };
  }
  if (team.members.length >= TEAM_MAX_MEMBERS) {
    throw new Error(`チームの上限は${TEAM_MAX_MEMBERS}人です`);
  }
  return { ...team, members: [...team.members, member] };
}

export function removeMember(team: Team, clientId: string): Team {
  return { ...team, members: team.members.filter((m) => m.clientId !== clientId) };
}
