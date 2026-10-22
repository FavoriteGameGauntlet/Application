import { persistentStorage, StoreKey } from '../../services/persistentStorage'
import type { Api, PartyMember } from '../contracts'
import { http } from '../http'
import {
	currentLogin,
	getMembers,
	type MemberDto,
	partyPath,
	toUserRefs,
	userRefOf,
} from './context'

const toPartyMember = (m: MemberDto): PartyMember => ({
	login: m.login,
	displayName: m.displayName ?? null,
	joinedDate: m.joinedDate,
	isAdmin: m.isAdmin,
})

export const session: Pick<Api['session'], 'getMe' | 'getSeason'> = {
	getMe: async () => {
		const login = await currentLogin()
		const members = await getMembers()
		const me = members.find((m) => m.login === login)

		if (!me) throw new Error('The user is not a member of the party')

		return { ...userRefOf(toUserRefs(members), login), isAdmin: me.isAdmin }
	},

	getSeason: async () => {
		const { id, name } = (
			await http.get<{ response: { id: number; name: string } }>(await partyPath())
		).body

		return { id, name }
	},
}

export const parties: Pick<Api['parties'], 'select'> = {
	select: (id) => persistentStorage.set(StoreKey.PartyId, id),
}

export const adminMembers: Api['admin']['members'] = {
	list: async () => (await getMembers()).map(toPartyMember),

	add: async (login) =>
		toPartyMember(
			(
				await http.post<{ response: MemberDto }>(`${await partyPath()}/members`, {
					body: { login, isAdmin: false },
				})
			).body,
		),

	update: async (login, { displayName, isAdmin }) => {
		await http.patch(`${await partyPath()}/members/${login}`, {
			// an empty string removes the display name
			body: { displayName: displayName ?? '', isAdmin },
		})

		const member = (await getMembers()).find((m) => m.login === login)

		if (!member) throw new Error('The member is not found')

		return toPartyMember(member)
	},

	remove: async (login) => {
		await http.delete(`${await partyPath()}/members/${login}`)
	},
}
