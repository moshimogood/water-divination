import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { FIVE_SYSTEMS, type FiveSystem, type Team, type TeamMember } from "@/lib/types";

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

function isValidMember(member: unknown): boolean {
  if (typeof member !== "object" || member === null) return false;
  const m = member as Record<string, unknown>;
  if (typeof m.clientId !== "string" || m.clientId.length === 0) return false;
  if (typeof m.nickname !== "string" || validateNickname(m.nickname) !== null) return false;
  if (typeof m.scores !== "object" || m.scores === null) return false;
  if (!Number.isFinite(m.specializationScore)) return false;
  const isFiveSystem = (v: unknown): v is FiveSystem =>
    typeof v === "string" && FIVE_SYSTEMS.includes(v as FiveSystem);
  if (m.mainSystem !== "specialization" && !isFiveSystem(m.mainSystem)) return false;
  if (!isFiveSystem(m.secondSystem)) return false;
  if (
    m.specializationPath !== undefined &&
    m.specializationPath !== "lowEngagement" &&
    m.specializationPath !== "duality" &&
    m.specializationPath !== null
  ) {
    return false;
  }
  const scores = m.scores as Record<string, unknown>;
  return FIVE_SYSTEMS.every((s) => Number.isFinite(scores[s]));
}

/**
 * Fills in specializationPath for members from older shared links that
 * predate it, defaulting a specialization result to "lowEngagement" (the
 * only path that existed at the time) so old team links keep working.
 */
function normalizeMember(member: Record<string, unknown>): TeamMember {
  const isSpecialization = member.mainSystem === "specialization";
  return {
    clientId: member.clientId as string,
    nickname: member.nickname as string,
    scores: member.scores as TeamMember["scores"],
    specializationScore: member.specializationScore as number,
    specializationPath: isSpecialization
      ? ((member.specializationPath as TeamMember["specializationPath"]) ?? "lowEngagement")
      : null,
    mainSystem: member.mainSystem as TeamMember["mainSystem"],
    secondSystem: member.secondSystem as TeamMember["secondSystem"],
  };
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
    if (team.members.length > TEAM_MAX_MEMBERS) return null;
    if (!team.members.every(isValidMember)) return null;
    const members = (team.members as Record<string, unknown>[]).map(normalizeMember);
    return { v: team.v, members };
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
