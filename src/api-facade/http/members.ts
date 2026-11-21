import type { Api, Login, Member } from '../contracts'
import { http } from '../http'
import {
	getAllMembers,
	type MemberDto,
	partyPath,
	toSeconds,
	userRefOf,
} from './context'

const toMember = (m: MemberDto): Member => ({
	user: userRefOf([m], m.login),
	leftDate: m.leftDate,
	displayName: m.displayName ?? null,
	status: m.status,
	currentGame: m.currentGame,
	playedSeconds: toSeconds(m.timeSpent),
	completedCount: m.completedCount,
	spinsCount: m.spinsCount,
})

export const members: Api['members'] = {
	list: async () => (await getAllMembers()).map(toMember),

	get: async (login: Login) => {
		const { body } = await http.get<{ response: MemberDto }>(
			`${await partyPath()}/members/${login}`,
		)

		return toMember(body)
	},
}
