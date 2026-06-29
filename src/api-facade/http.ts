import { Temporal } from '@js-temporal/polyfill'
import { type ClientOptions, fetch } from '@tauri-apps/plugin-http'
import { API_URL } from '../constants/apiUrl'
import { unauthorizedInterceptor } from './interceptors/unauthorizedInterceptor'

export type HttpErrorResponse = {
	status: number
	statusText: string
	body?: {
		code: string
		message: string
	}
	url: string
	method: string
}

export type HttpResponse<T = object | string> = Omit<Response, 'body'> & {
	body: T
}

const parseBody = async (response: Response) => {
	const body = await response.text()

	try {
		return body.length ? JSON.parse(body) : body
	} catch {
		// not JSON
		return body
	}
}

const makeRequest = async <T extends object | string = object | string>(
	url: string,
	opts?: RequestInit & ClientOptions,
): Promise<HttpResponse<T>> => {
	const fullUrl = API_URL + url
	const method = opts?.method || 'GET'

	const requestTime = Temporal.Now.zonedDateTimeISO()
	const requestTimestamp = `${requestTime.hour.toString().padStart(2, '0')}:${requestTime.minute.toString().padStart(2, '0')}:${requestTime.second.toString().padStart(2, '0')}.${requestTime.millisecond.toString().padStart(3, '0')}`

	console.log(`[HTTP] ${method} ${fullUrl} | ${requestTimestamp}`, {
		body: opts?.body,
		headers: {
			'Content-Type': 'application/json',
			...opts?.headers,
		},
	})

	try {
		const response = await fetch(fullUrl, {
			...opts,
			headers: {
				'Content-Type': 'application/json',
				...opts?.headers,
			},
		})
		const responseBody: T = await parseBody(response)

		const time = Temporal.Now.zonedDateTimeISO()
		const timestamp = `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}:${time.second.toString().padStart(2, '0')}.${time.millisecond.toString().padStart(3, '0')}`

		console.log(
			`[HTTP] ${method} ${fullUrl} - ${response.status} | ${timestamp}`,
			{
				body: responseBody,
			},
		)

		if (!response.ok) {
			const e = {
				status: response.status,
				statusText: response.statusText,
				body: responseBody as HttpErrorResponse['body'],
				url: fullUrl,
				method,
			} satisfies HttpErrorResponse

			throw e
		}

		return {
			...response,
			body: responseBody,
		}
	} catch (error) {
		unauthorizedInterceptor(error as HttpErrorResponse)

		console.error(`[HTTP] ${method} ${fullUrl} - ERROR`, error)
		throw error
	}
}

type HttpRequestOptions = Omit<
	RequestInit & ClientOptions,
	'method' | 'body'
> & {
	body?: object | string | null
}

export const http = {
	get: <
		T extends { request?: unknown; response?: unknown } = {
			request: undefined
			response: undefined
		},
	>(
		url: string,
		opts?: HttpRequestOptions,
	): Promise<HttpResponse<T['response']>> =>
		makeRequest(url, {
			...opts,
			body: opts?.body ? JSON.stringify(opts.body) : undefined,
			method: 'GET',
		}),

	post: <
		T extends { request?: unknown; response?: unknown } = {
			request: undefined
			response: undefined
		},
	>(
		url: string,
		opts?: HttpRequestOptions,
	): Promise<HttpResponse<T['response']>> =>
		makeRequest(url, {
			...opts,
			body: opts?.body ? JSON.stringify(opts.body) : undefined,
			method: 'POST',
		}),
}
