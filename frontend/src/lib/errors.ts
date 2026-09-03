import axios from 'axios';

export const EMAIL_ALREADY_REGISTERED_MESSAGE =
  'This email is already registered. Try signing in instead.';

interface ApiErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string | string[];
}

function getApiErrorBody(error: unknown): ApiErrorBody | null {
  if (!axios.isAxiosError(error)) {
    return null;
  }
  const data = error.response?.data;
  return typeof data === 'object' && data !== null ? (data as ApiErrorBody) : null;
}

/**
 * Pulls the backend's message out of an axios error. Without this the UI shows
 * axios' own "Request failed with status code 400" instead of what the API said.
 * `message` is a string for thrown HttpExceptions and a string[] for DTO
 * validation failures.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const message = getApiErrorBody(error)?.message;

  if (Array.isArray(message)) {
    return message.join(' ');
  }

  return message || fallback;
}

/** True when a register attempt failed because the email is already taken. */
export function isEmailAlreadyRegisteredError(error: unknown): boolean {
  const body = getApiErrorBody(error);
  if (!body) {
    return false;
  }

  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  if (status !== 400 && status !== 409) {
    return false;
  }

  const message = Array.isArray(body.message) ? body.message.join(' ') : (body.message ?? '');
  return message.toLowerCase().includes('already registered');
}
