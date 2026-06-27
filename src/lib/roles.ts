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