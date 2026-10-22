import { persistentStorage, StoreKey } from '../../services/persistentStorage'
import type { ISODate, Login, UserRef } from '../contracts'
import { http } from '../http'

/** the number of `--user-N` colors in the theme */
const USER_COLORS = 8

export const currentLogin = async () => {
	const login = await persistentStorage.get(StoreKey.Login)

	if (login === undefined) throw new Error('The user is not logged in')

	return login
}

/** `/parties/{partyId}` of the party chosen with `parties.select` */
export const partyPath = async () => {
	const id = await persistentStorage.get(StoreKey.PartyId)

	if (id === undefined) throw new Error('The party is not selected')

	return `/parties/${id}`
}

export type MemberDto = {
	login: Login
	displayName?: string
	isAdmin: boolean
	joinedDate: ISODate
}

export const getMembers = async () =>
	(await http.get<{ response: MemberDto[] }>(`${await partyPath()}/members`)).body

/** the color follows the order the users joined the party, the backend has none */
export const toUserRefs = (members: MemberDto[]) => {
	const sorted = [...members].sort(
		(a, b) =>
			a.joinedDate.localeCompare(b.joinedDate) || a.login.localeCompare(b.login),
	)

	return new Map<Login, UserRef>(
		sorted.map((m, i) => [m.login, { login: m.login, colorIndex: (i % USER_COLORS) + 1 }]),
	)
}

export const userRefOf = (refs: Map<Login, UserRef>, login: Login): UserRef =>
	refs.get(login) ?? { login, colorIndex: 1 }
