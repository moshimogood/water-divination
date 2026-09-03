import { describe, it, expect } from "vitest";
import { compressToEncodedURIComponent } from "lz-string";
import {
  encodeTeam,
  decodeTeam,
  upsertMember,
  removeMember,
  validateNickname,
  TEAM_MAX_MEMBERS,
  NICKNAME_MAX_LENGTH,
} from "@/lib/team";
import type { Team, TeamMember } from "@/lib/types";

function makeMember(clientId: string, nickname = "テスト"): TeamMember {
  return {
    clientId,
    nickname,
    scores: {
      enhancement: 80,
      transmutation: 60,
      emission: 40,
      conjuration: 20,
      manipulation: 30,
    },
    specializationScore: 10,
    specializationPath: null,
    mainSystem: "enhancement",
    secondSystem: "transmutation",
  };
}

const emptyTeam: Team = { v: 1, members: [] };

describe("encodeTeam / decodeTeam", () => {
  it("round-trips a team through a URL query parameter", () => {
    const team = upsertMember(emptyTeam, makeMember("abc", "ゴン"));
    const encoded = encodeTeam(team);
    const params = new URLSearchParams();
    params.set("t", encoded);
    const restored = new URLSearchParams(params.toString()).get("t");
    expect(restored).toBe(encoded);
    expect(decodeTeam(restored!)).toEqual(team);
  });

  it("returns null for garbage input", () => {
    expect(decodeTeam("not-a-valid-payload")).toBeNull();
    expect(decodeTeam("")).toBeNull();
  });

  it("returns null for structurally invalid payloads", () => {
    const bad = compressToEncodedURIComponent(JSON.stringify({ hello: "world" }));
    expect(decodeTeam(bad)).toBeNull();
  });

  it("round-trips a duality specialization member", () => {
    const team = upsertMember(emptyTeam, {
      ...makeMember("d", "ヒソカ"),
      mainSystem: "specialization",
      secondSystem: "transmutation",
      specializationPath: "duality",
    });
    expect(decodeTeam(encodeTeam(team))).toEqual(team);
  });

  it("defaults specializationPath to lowEngagement for older links without it", () => {
    // Simulate a pre-duality shared link: a specialization member whose
    // payload has no "specializationPath" key at all.
    const legacyMember = {
      clientId: "old",
      nickname: "レガシー",
      scores: { enhancement: 20, transmutation: 22, emission: 18, conjuration: 21, manipulation: 19 },
      specializationScore: 80,
      mainSystem: "specialization",
      secondSystem: "enhancement",
    };
    const legacy = compressToEncodedURIComponent(JSON.stringify({ v: 1, members: [legacyMember] }));
    const decoded = decodeTeam(legacy);
    expect(decoded?.members[0].specializationPath).toBe("lowEngagement");
  });
});

describe("upsertMember", () => {
  it("appends a new member", () => {
    const team = upsertMember(emptyTeam, makeMember("a"));
    expect(team.members).toHaveLength(1);
  });

  it("overwrites the member with the same clientId instead of appending", () => {
    let team = upsertMember(emptyTeam, makeMember("a", "旧名"));
    team = upsertMember(team, makeMember("b"));
    team = upsertMember(team, makeMember("a", "新名"));
    expect(team.members).toHaveLength(2);
    expect(team.members[0].nickname).toBe("新名");
    expect(team.members[0].clientId).toBe("a");
  });

  it("does not mutate the original team", () => {
    const team = upsertMember(emptyTeam, makeMember("a"));
    upsertMember(team, makeMember("b"));
    expect(team.members).toHaveLength(1);
  });

  it("rejects adding beyond the member limit", () => {
    let team = emptyTeam;
    for (let i = 0; i < TEAM_MAX_MEMBERS; i++) {
      team = upsertMember(team, makeMember(`m${i}`));
    }
    expect(() => upsertMember(team, makeMember("overflow"))).toThrow();
    // but updating an existing member is still allowed at the limit
    const updated = upsertMember(team, makeMember("m0", "更新"));
    expect(updated.members[0].nickname).toBe("更新");
  });
});

describe("removeMember", () => {
  it("removes by clientId and leaves others", () => {
    let team = upsertMember(emptyTeam, makeMember("a"));
    team = upsertMember(team, makeMember("b"));
    const after = removeMember(team, "a");
    expect(after.members.map((m) => m.clientId)).toEqual(["b"]);
  });

  it("is a no-op for unknown clientId", () => {
    const team = upsertMember(emptyTeam, makeMember("a"));
    expect(removeMember(team, "zzz").members).toHaveLength(1);
  });
});

describe("validateNickname", () => {
  it("requires a non-empty nickname", () => {
    expect(validateNickname("")).not.toBeNull();
    expect(validateNickname("   ")).not.toBeNull();
  });

  it("accepts nicknames up to the max length", () => {
    expect(validateNickname("あ".repeat(NICKNAME_MAX_LENGTH))).toBeNull();
    expect(validateNickname("ゴン")).toBeNull();
  });

  it("rejects nicknames over the max length", () => {
    expect(validateNickname("あ".repeat(NICKNAME_MAX_LENGTH + 1))).not.toBeNull();
  });
});
