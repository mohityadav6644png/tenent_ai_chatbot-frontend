import { APP_INSIGHTS_CONNECTION_STRING } from '../../config/env.js';

export function initializeMonitoring() {
  return Boolean(APP_INSIGHTS_CONNECTION_STRING);
}

export function trackError(error) {
  if (APP_INSIGHTS_CONNECTION_STRING) {
    console.error('Application error', error);
  }
}
