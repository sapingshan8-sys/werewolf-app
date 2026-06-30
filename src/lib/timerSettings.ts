export type TimerSettings = {
  discussionSeconds: number;
  eveningSeconds: number;
  nightSeconds: number;
};

export const defaultTimerSettings: TimerSettings = {
  discussionSeconds: 300,
  eveningSeconds: 120,
  nightSeconds: 60,
};

export function normalizeTimerSettings(
  value: Partial<TimerSettings> | null | undefined
): TimerSettings {
  return {
    discussionSeconds:
      value?.discussionSeconds ??
      defaultTimerSettings.discussionSeconds,
    eveningSeconds:
      value?.eveningSeconds ??
      defaultTimerSettings.eveningSeconds,
    nightSeconds:
      value?.nightSeconds ??
      defaultTimerSettings.nightSeconds,
  };
}

export function clampTimerSeconds(value: number) {
  return Math.min(3600, Math.max(30, value));
}
