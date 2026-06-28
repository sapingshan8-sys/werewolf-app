export const roleLabels: Record<string, string> = {
  crew: "乗員",
  gnosia: "グノーシア",
  engineer: "エンジニア",
  doctor: "ドクター",
  guardianAngel: "守護天使",
  guardDuty: "留守番",
  acFollower: "AC主義者",
  bug: "バグ",
};

export const configurableRoles = [
  "crew",
  "gnosia",
  "engineer",
  "doctor",
  "guardianAngel",
  "guardDuty",
  "acFollower",
  "bug",
];

export type RoleCounts = Record<string, number>;

export function getRoles(playerCount: number): string[] {
  switch (playerCount) {
    case 2:
      return [
        "crew",
        "gnosia",
      ];

    case 3:
      return [
        "crew",
        "engineer",
        "gnosia",
      ];

    case 4:
      return [
        "crew",
        "crew",
        "engineer",
        "gnosia",
      ];

    case 5:
      return [
        "crew",
        "crew",
        "engineer",
        "bug",
        "gnosia",
      ];

    case 6:
      return [
        "crew",
        "crew",
        "engineer",
        "doctor",
        "bug",
        "gnosia",
      ];

    case 7:
      return [
        "crew",
        "crew",
        "crew",
        "engineer",
        "doctor",
        "guardianAngel",
        "gnosia",
      ];

    case 8:
      return [
        "crew",
        "crew",
        "crew",
        "engineer",
        "doctor",
        "guardianAngel",
        "acFollower",
        "gnosia",
      ];

    case 9:
      return [
        "crew",
        "crew",
        "crew",
        "engineer",
        "doctor",
        "guardianAngel",
        "guardDuty",
        "acFollower",
        "gnosia",
      ];

    case 10:
      return [
        "crew",
        "crew",
        "crew",
        "engineer",
        "doctor",
        "guardianAngel",
        "guardDuty",
        "acFollower",
        "bug",
        "gnosia",
      ];

    default:
      return [];
  }
}

export function getDefaultRoleCounts(
  playerCount: number
): RoleCounts {
  const roles = getRoles(playerCount);

  return configurableRoles.reduce<RoleCounts>(
    (counts, role) => {
      counts[role] = roles.filter(
        (item) => item === role
      ).length;

      return counts;
    },
    {}
  );
}

export function buildRolesFromCounts(
  roleCounts: RoleCounts
) {
  return configurableRoles.flatMap((role) =>
    Array.from(
      {
        length: Math.max(
          0,
          roleCounts[role] ?? 0
        ),
      },
      () => role
    )
  );
}
