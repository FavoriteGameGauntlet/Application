import type { Api, Login, PointType } from '../contracts'
import { http } from '../http'
import { getMembers, partyPath, toUserRefs, userRefOf } from './context'

type PointValueDto = { pointType: PointType; value: number }

export const resources: Pick<
	Api['resources'],
	'pointTypes' | 'sharedPoints' | 'leaderboard' | 'summary' | 'catalog'
> = {
	pointTypes: async () =>
		(await http.get<{ response: PointType[] }>(`${await partyPath()}/points/types`))
			.body,

	sharedPoints: async () => {
		const points = (
			await http.get<{ response: PointValueDto[] }>(`${await partyPath()}/points/party`)
		).body

		return Object.fromEntries(points.map((p) => [p.pointType.id, p.value]))
	},

	leaderboard: async (typeId) => {
		const path = await partyPath()
		const [members, { body: users }] = await Promise.all([
			getMembers(),
			http.get<{ response: { login: Login; points: PointValueDto[] }[] }>(
				`${path}/points/users`,
			),
		])
		const refs = toUserRefs(members)

		return {
			typeId,
			rows: users
				.map(({ login, points }) => ({
					user: userRefOf(refs, login),
					value: points.find((p) => p.pointType.id === typeId)?.value ?? 0,
				}))
				.sort((a, b) => b.value - a.value),
		}
	},

	summary: async (kind) => {
		const path = await partyPath()

		return Promise.all(
			(await getMembers()).map(async ({ login }) => ({
				login,
				count: (await http.get<{ response: unknown[] }>(`${path}/${kind}/${login}`)).body
					.length,
			})),
		)
	},

	catalog: async (kind) =>
		(
			await http.get<{ response: { id: number; name: string }[] }>(
				`${await partyPath()}/${kind}/catalog`,
			)
		).body.map(({ id, name }) => ({ id, name })),
}
