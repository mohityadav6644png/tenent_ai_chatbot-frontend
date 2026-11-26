const ERROR_MESSAGES = Object.freeze({
  AUTH_INVALID_CREDENTIALS: 'The email or password is incorrect.',
  AUTH_UNAUTHORIZED: 'Please sign in to continue.',
  CSRF_FAILED: 'Your session security token is missing or expired. Sign in again and retry.',
  RATE_LIMITED: 'Too many attempts. Try again in a few minutes.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NETWORK_ERROR: 'Unable to reach the server. Check your connection and try again.',
  TENANT_NOT_FOUND: 'That company could not be found. Refresh the list and try again.',
  TENANT_ALREADY_SUSPENDED: 'That company is already suspended.',
  TENANT_NOT_SUSPENDED: 'That company is not currently suspended.',
  TENANT_ACTION_FAILED: 'We could not update that company. Please try again.',
  TENANT_EXISTS: 'A company with this name already exists.',
  VALIDATION_ERROR: 'Check the company details and try again.',
  INVITE_FAILED: 'We could not create the company or send its invite. Please try again.',
  INTERNAL_ERROR: 'The request could not be completed. Please try again.',
  LAST_ADMIN: "You can't deactivate the last admin.",
  USER_NOT_FOUND: 'That user could not be found. Refresh the list and try again.',
  INVITE_NOT_FOUND: 'That invite could not be found. Refresh the list and try again.',
  USER_ACTION_FAILED: 'We could not update that user. Please try again.',
  INVITE_ACTION_FAILED: 'We could not update that invite. Please try again.',
  USER_EXISTS: 'This person already has an account.',
  INVITE_EXISTS: 'An invite is already pending for this email. Use Resend on the Users page.',
  REPORT_NOT_FOUND: 'That report could not be found. Refresh the list and try again.',
  REPORT_ACTION_FAILED: 'We could not update that report. Please try again.',
  MISSING_COLUMNS: 'Your file needs a title column and a content column. Enter the column names below and try again.',
  IMPORT_IN_PROGRESS: 'Another import for this dataset is already in progress. Please wait.',
  FORBIDDEN_ROLE: "You don't have access to this page.",
  UNAUTHENTICATED: 'Your session has expired. Please sign in again.',
  NOT_FOUND: 'The requested resource was not found.',
  PAYLOAD_TOO_LARGE: 'File size exceeds the server limit. Please upload a smaller file.',
  FILE_EXISTS: 'A file with this name already exists.',
  FILE_LIMIT_REACHED: 'You have reached the maximum number of files allowed for your company.',
  INVALID_FILE: 'The uploaded file could not be processed.',
});

const CHAT_ERROR_MESSAGES = Object.freeze({
  RATE_LIMITED: 'Too many requests. Please wait before asking again.',
  LLM_UNAVAILABLE: 'The AI service is busy. Please try again in a moment.',
  QUERY_REFUSED: 'I can only help with your company data.',
  UNSAFE_QUERY: 'That request cannot be run safely. Try asking in a different way.',
  INVALID_CHAT_REQUEST: 'Your question could not be processed. Please try again.',
  INVALID_REQUEST: 'Your question could not be processed. Please try again.',
  TENANT_ACCESS_DENIED: 'You do not have access to that company data.',
  DATA_ACCESS_DENIED: 'You do not have access to that company data.',
  DATA_NOT_FOUND: 'No matching company data was found.',
  QUERY_TIMEOUT: 'The request took too long. Please try again.',
  SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again.',
  INTERNAL_ERROR: 'Something went wrong while getting your answer.',
  QUERY_FAILED: 'We could not get an answer. Please try again.',
  AUTH_UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  FORBIDDEN: 'You do not have permission to access this data.',
});

export function mapApiError(error) {
  if (error?.code && Object.hasOwn(ERROR_MESSAGES, error.code)) {
    return ERROR_MESSAGES[error.code];
  }
  if (error?.status === 413) {
    return ERROR_MESSAGES.PAYLOAD_TOO_LARGE;
  }
  if (error?.status === 429) {
    return ERROR_MESSAGES.RATE_LIMITED;
  }
  if (error?.status === 403) {
    return ERROR_MESSAGES.FORBIDDEN;
  }
  if (error?.status === 422) {
    return ERROR_MESSAGES.VALIDATION_ERROR;
  }
  if (error?.status === 401) {
    return ERROR_MESSAGES.AUTH_UNAUTHORIZED;
  }
  if (error instanceof TypeError) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  return 'Something went wrong. Please try again.';
}

export function mapChatError(error) {
  const code = error?.code || error?.error?.code;
  const status = error?.status;
  const rateLimited = code === 'RATE_LIMITED' || status === 429;
  const retryAfter = Number(
    error?.retryAfterSeconds ?? error?.retry_after_seconds ?? error?.error?.retry_after_seconds,
  );
  return {
    message: rateLimited
      ? CHAT_ERROR_MESSAGES.RATE_LIMITED
      : CHAT_ERROR_MESSAGES[code] || 'We could not get an answer. Please try again.',
    rateLimited,
    retryable: rateLimited || Boolean(error?.retryable ?? error?.error?.retryable ?? (status >= 500)),
    retryAfterSeconds: rateLimited
      ? Number.isFinite(retryAfter) && retryAfter > 0 ? Math.ceil(retryAfter) : 300
      : undefined,
  };
}

export function mapLoginError(error) {
  if (
    error?.code === 'RATE_LIMITED'
    || error?.status === 429
  ) {
    return ERROR_MESSAGES.RATE_LIMITED;
  }
  if (
    error?.status === 401
    || error?.code === 'INVALID_CREDENTIALS'
    || error?.code === 'AUTH_INVALID_CREDENTIALS'
  ) {
    return 'Invalid email or password.';
  }
  return mapApiError(error);
}

export function normalizeError(error) {
  const code = error?.code || error?.error?.code || (
    error?.status === 413 ? 'PAYLOAD_TOO_LARGE'
    : error?.status === 404 ? 'NOT_FOUND'
    : error?.status === 403 ? 'FORBIDDEN_ROLE'
    : error?.status === 401 ? 'UNAUTHENTICATED'
    : error?.status === 409 ? 'IMPORT_IN_PROGRESS'
    : error?.status === 429 ? 'RATE_LIMITED'
    : error instanceof TypeError ? 'NETWORK_ERROR'
    : undefined
  );
  const status = error?.status ?? error?.error?.status;
  const retryAfter = error?.retryAfter ?? error?.retryAfterSeconds ?? error?.retry_after_seconds ?? error?.error?.retry_after;
  const details = error?.details ?? error?.error?.details;

  let message = 'Something went wrong. Please try again.';
  if (code && Object.hasOwn(ERROR_MESSAGES, code)) {
    message = ERROR_MESSAGES[code];
  } else if (status === 401) {
    message = ERROR_MESSAGES.UNAUTHENTICATED || ERROR_MESSAGES.AUTH_UNAUTHORIZED;
  } else if (status === 403) {
    message = ERROR_MESSAGES.FORBIDDEN_ROLE || ERROR_MESSAGES.FORBIDDEN;
  } else if (status === 404) {
    message = ERROR_MESSAGES.NOT_FOUND;
  } else if (status === 409) {
    message = ERROR_MESSAGES.IMPORT_IN_PROGRESS;
  } else if (status === 413) {
    message = ERROR_MESSAGES.PAYLOAD_TOO_LARGE;
  } else if (status === 429) {
    message = ERROR_MESSAGES.RATE_LIMITED;
  } else if (error instanceof TypeError) {
    message = ERROR_MESSAGES.NETWORK_ERROR;
  }

  if ((code === 'RATE_LIMITED' || status === 429) && retryAfter) {
    message = `Too many requests. Please try again in ${retryAfter} seconds.`;
  }

  return {
    code,
    status,
    retryAfter,
    details,
    message,
  };
}
