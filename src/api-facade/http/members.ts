import type { Api, Login, Member } from '../contracts'
import { http } from '../http'
import {
	getMembers,
	type MemberDto,
	partyPath,
	toSeconds,
	userRefOf,
} from './context'

const toMember = (m: MemberDto, all: MemberDto[]): Member => ({
	user: userRefOf(all, m.login),
	displayName: m.displayName ?? null,
	status: m.status,
	currentGame: m.currentGame,
	playedSeconds: toSeconds(m.timeSpent),
	completedCount: m.completedCount,
	spinsCount: m.spinsCount,
})

export const members: Api['members'] = {
	list: async () => {
		const all = await getMembers()

		return all.map((m) => toMember(m, all))
	},

	get: async (login: Login) => {
		const { body } = await http.get<{ response: MemberDto }>(
			`${await partyPath()}/members/${login}`,
		)

		return toMember(body, [body])
	},
}
