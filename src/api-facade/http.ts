import { Temporal } from '@js-temporal/polyfill'
import { invoke } from '@tauri-apps/api/core'
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

export type HttpResponse<T = object | string> = {
	status: number
	statusText: string
	body: T
}

/** the answer of the `http_request` command in `src-tauri/src/http.rs` */
type RawResponse = {
	status: number
	statusText: string
	body: string
}

const parseBody = (body: string) => {
	try {
		return body.length ? JSON.parse(body) : body
	} catch {
		// not JSON
		return body
	}
}

const makeRequest = async <T extends object | string = object | string>(
	url: string,
	opts: { method: string; body?: string },
): Promise<HttpResponse<T>> => {
	const fullUrl = API_URL + url
	const method = opts.method

	const requestTime = Temporal.Now.zonedDateTimeISO()
	const requestTimestamp = `${requestTime.hour.toString().padStart(2, '0')}:${requestTime.minute.toString().padStart(2, '0')}:${requestTime.second.toString().padStart(2, '0')}.${requestTime.millisecond.toString().padStart(3, '0')}`

	console.log(`[Request] ${method} ${fullUrl} | ${requestTimestamp}`, {
		body: opts.body,
	})

	try {
		const response = await invoke<RawResponse>('http_request', {
			method,
			url: fullUrl,
			body: opts.body,
		})
		const responseBody: T = parseBody(response.body)

		const time = Temporal.Now.zonedDateTimeISO()
		const timestamp = `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}:${time.second.toString().padStart(2, '0')}.${time.millisecond.toString().padStart(3, '0')}`

		console.log(
			`[Response] ${method} ${fullUrl} - ${response.status} | ${timestamp}`,
			{
				body: responseBody,
			},
		)

		if (response.status < 200 || response.status >= 300) {
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
		await unauthorizedInterceptor(error as HttpErrorResponse)

		throw error
	}
}

type HttpRequestOptions = {
	body?: object | string | null
}

const withMethod =
	(method: string) =>
	<
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
			method,
		})

export const http = {
	put: withMethod('PUT'),
	patch: withMethod('PATCH'),
	delete: withMethod('DELETE'),

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
