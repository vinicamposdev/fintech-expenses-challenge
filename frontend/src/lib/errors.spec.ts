import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import { getApiErrorMessage, isEmailAlreadyRegisteredError } from './errors';

function axiosErrorWith(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, {
    status,
    statusText: '',
    headers: {},
    config,
    data,
  } as never);
}

describe('getApiErrorMessage', () => {
  it('returns the backend message instead of axios own wording', () => {
    const error = axiosErrorWith(400, { message: 'Amount must be positive' });

    expect(getApiErrorMessage(error, 'fallback')).toBe('Amount must be positive');
  });

  it('joins the array of messages a DTO validation failure returns', () => {
    const error = axiosErrorWith(400, {
      message: ['email must be an email', 'password is too short'],
    });

    expect(getApiErrorMessage(error, 'fallback')).toBe(
      'email must be an email password is too short'
    );
  });

  it('falls back when the response carries no message', () => {
    expect(getApiErrorMessage(axiosErrorWith(500, {}), 'fallback')).toBe('fallback');
  });

  it('falls back for a network error with no response at all', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK');

    expect(getApiErrorMessage(error, 'fallback')).toBe('fallback');
  });

  it('falls back for errors that did not come from axios', () => {
    expect(getApiErrorMessage(new Error('boom'), 'fallback')).toBe('fallback');
  });
});

describe('isEmailAlreadyRegisteredError', () => {
  it('recognises the 409 conflict the API returns for a duplicate email', () => {
    const error = axiosErrorWith(409, { message: 'Email already registered' });

    expect(isEmailAlreadyRegisteredError(error)).toBe(true);
  });

  it('recognises the same message on a 400', () => {
    const error = axiosErrorWith(400, { message: ['Email already registered'] });

    expect(isEmailAlreadyRegisteredError(error)).toBe(true);
  });

  it('ignores other 400s so unrelated failures are not mislabelled', () => {
    const error = axiosErrorWith(400, { message: 'password is too short' });

    expect(isEmailAlreadyRegisteredError(error)).toBe(false);
  });

  it('ignores the message on an unrelated status', () => {
    const error = axiosErrorWith(500, { message: 'Email already registered' });

    expect(isEmailAlreadyRegisteredError(error)).toBe(false);
  });

  it('ignores non-axios errors', () => {
    expect(isEmailAlreadyRegisteredError(new Error('boom'))).toBe(false);
  });
});
