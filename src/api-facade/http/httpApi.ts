import type { Api } from '../contracts'

const notImplemented = () => {
	throw new Error('HTTP API is not implemented yet')
}

// TODO: replace with real calls through ../http.ts once the backend is ready
export const httpApi = new Proxy({} as Api, {
	get: () => new Proxy({}, { get: () => notImplemented }),
})
