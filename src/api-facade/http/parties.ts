import { persistentStorage, StoreKey } from '../../services/persistentStorage'
import type { Api, Party, PartyInput, PartyMember } from '../contracts'
import { http } from '../http'
import {
	currentLogin,
	getAllMembers,
	getMembers,
	type MemberDto,
	partyPath,
	userRefOf,
} from './context'

const toPartyMember = (m: MemberDto): PartyMember => ({
	login: m.login,
	displayName: m.displayName ?? null,
	joinedDate: m.joinedDate,
	leftDate: m.leftDate ?? null,
	isAdmin: m.isAdmin,
	color: m.color,
})

export const session: Pick<Api['session'], 'getMe' | 'getSeason'> = {
	getMe: async () => {
		const login = await currentLogin()
		const members = await getMembers()
		const me = members.find((m) => m.login === login)

		if (!me) throw new Error('The user is not a member of the party')

		return { ...userRefOf(members, login), isAdmin: me.isAdmin }
	},

	getSeason: async () => {
		const { id, name } = (
			await http.get<{ response: { id: number; name: string } }>(
				await partyPath(),
			)
		).body

		return { id, name }
	},
}

type PartyDto = Pick<
	Party,
	'id' | 'name' | 'membersCount' | 'status' | 'role'
> & {
	createdDate: string
	startDate: string
	endDate: string
}

const toParty = (
	{ createdDate, startDate, endDate, ...party }: PartyDto,
	selected: number | undefined,
): Party => ({
	...party,
	createdAt: createdDate,
	startsAt: startDate,
	endsAt: endDate,
	current: party.id === selected,
})

const toPartyBody = ({ name, startsAt, endsAt }: PartyInput) => ({
	name,
	startDate: startsAt,
	endDate: endsAt,
})

export const parties: Api['parties'] = {
	list: async () => {
		const [{ body }, selected] = await Promise.all([
			http.get<{ response: PartyDto[] }>('/parties'),
			persistentStorage.get(StoreKey.PartyId),
		])

		return body.map((party) => toParty(party, selected))
	},

	create: async ({ creatorColor, ...input }) =>
		toParty(
			(
				await http.post<{ response: PartyDto }>('/parties', {
					body: { ...toPartyBody(input), creatorColor },
				})
			).body,
			await persistentStorage.get(StoreKey.PartyId),
		),

	update: async (id, input) => {
		await http.patch(`/parties/${id}`, { body: toPartyBody(input) })
	},

	select: (id) => persistentStorage.set(StoreKey.PartyId, id),
}

export const adminMembers: Api['admin']['members'] = {
	list: async () => (await getAllMembers()).map(toPartyMember),

	add: async (login, color) =>
		toPartyMember(
			(
				await http.post<{ response: MemberDto }>(
					`${await partyPath()}/members`,
					{
						body: { login, isAdmin: false, color },
					},
				)
			).body,
		),

	update: async (login, { displayName, isAdmin, color }) => {
		await http.patch(`${await partyPath()}/members/${login}`, {
			// an empty string removes the display name
			body: { displayName: displayName ?? '', isAdmin, color },
		})

		const member = (await getAllMembers()).find((m) => m.login === login)

		if (!member) throw new Error('The member is not found')

		return toPartyMember(member)
	},

	remove: async (login) => {
		await http.delete(`${await partyPath()}/members/${login}`)
	},

	restore: async (login) => {
		await http.post(`${await partyPath()}/members/${login}/restore`)
	},
}
