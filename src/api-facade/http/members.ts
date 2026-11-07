import type { Api, Login, Member, UserRef } from '../contracts'
import { http } from '../http'
import {
	getMembers,
	type MemberDto,
	partyPath,
	toSeconds,
	toUserRefs,
	userRefOf,
} from './context'

const toMember = (m: MemberDto, user: UserRef): Member => ({
	user,
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
		const refs = toUserRefs(all)

		return all.map((m) => toMember(m, userRefOf(refs, m.login)))
	},

	get: async (login: Login) => {
		const [{ body }, all] = await Promise.all([
			partyPath().then((path) =>
				http.get<{ response: MemberDto }>(`${path}/members/${login}`),
			),
			getMembers(),
		])

		return toMember(body, userRefOf(toUserRefs(all), login))
	},
}
