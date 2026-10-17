import type { HttpErrorResponse } from '../http'

const delay = () =>
	new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 150))

export function fail(status: number, code: string, message: string): never {
	throw {
		status,
		statusText: code,
		body: { code, message },
		url: '',
		method: '',
	} satisfies HttpErrorResponse
}

/** simulates network latency and isolates the "server" state from the client */
export const reply = async <T>(fn: () => T): Promise<T> => {
	await delay()
	return structuredClone(fn())
}

export const now = () => new Date().toISOString()

let lastId = 1000

/** ids of the records created by the "server" */
export const newId = () => ++lastId
