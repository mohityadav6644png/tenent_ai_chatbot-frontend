export const featureFlags = Object.freeze({});

export function isFeatureEnabled(flagName) {
  return featureFlags[flagName] === true;
}
