import type { HttpErrorResponse } from './http'

const SESSION_EXPIRED_CODES = ['COOKIE_NOT_FOUND', 'ACTIVE_SESSION_NOT_FOUND']

/** the session cookie lives a day, so its end is routine: the user goes to the login, not to an error */
export const isSessionExpired = (e: unknown) => {
	const response = e as Partial<HttpErrorResponse>

	return (
		response.status === 401 &&
		SESSION_EXPIRED_CODES.includes(response.body?.code ?? '')
	)
}
