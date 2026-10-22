import type { Api } from '../contracts'
import { auth } from './auth'
import { adminExchanges, exchanges } from './exchanges'
import { completed, currentGame, wishlist } from './games'
import { adminMembers, parties, session } from './parties'
import { resources } from './resources'

type DeepPartial<T> = {
	[K in keyof T]?: T[K] extends (...args: never[]) => unknown
		? T[K]
		: DeepPartial<T[K]>
}

const notImplemented = () => {
	throw new Error('HTTP API is not implemented yet')
}

// a method or a group the backend can't serve yet: any property reads as the
// same stub, calling it throws
const notReady = (): unknown =>
	new Proxy(notImplemented, {
		get: (_, key) => (typeof key === 'symbol' ? undefined : notReady()),
	})

const withStubs = (implemented: object): unknown =>
	new Proxy(implemented, {
		get: (target, key) => {
			if (typeof key === 'symbol') return undefined

			const value = Reflect.get(target, key)

			if (value === undefined) return notReady()

			return typeof value === 'object' ? withStubs(value) : value
		},
	})

// Only the methods whose result the backend covers completely are here; the
// rest of the Api (see the "Backend (missing)" notes in contracts.ts) is stubbed
const implemented: DeepPartial<Api> = {
	auth,
	session,
	currentGame,
	wishlist,
	completed,
	resources,
	exchanges,
	parties,
	admin: { exchanges: adminExchanges, members: adminMembers },
}

export const httpApi = withStubs(implemented) as Api
