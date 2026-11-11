import type { Api, RewardRow, Rewards, RewardTrigger } from '../contracts'
import { http } from '../http'
import type { NamedChangeEntryDto } from './changeEntry'
import { partyPath } from './context'
import { fromChangeRow, toChangeRow } from './rows'

const triggers: RewardTrigger[] = [
	'timer',
	'timer_created',
	'game_completed',
	'game_cancelled',
	'game_rerolled',
]

const getRows = async (
	path: string,
	trigger: RewardTrigger,
): Promise<RewardRow[]> =>
	(
		await http.get<{ response: { entries: NamedChangeEntryDto[] } }>(
			`${path}/rewards/${trigger}`,
		)
	).body.entries.map(toChangeRow)

const getAll = async (path: string) =>
	Object.fromEntries(
		await Promise.all(
			triggers.map(async (t) => [t, await getRows(path, t)] as const),
		),
	) as Rewards

const sameRows = (a: RewardRow[], b: RewardRow[]) =>
	JSON.stringify(a) === JSON.stringify(b)

export const adminRewards: Api['admin']['rewards'] = {
	get: async () => getAll(await partyPath()),

	save: async (rewards) => {
		const path = await partyPath()
		const current = await getAll(path)

		// setting a reward keeps the previous one as removed, so only a changed block is written
		for (const trigger of triggers) {
			const rows = rewards[trigger]

			if (sameRows(rows, current[trigger])) continue

			if (rows.length === 0) {
				await http.delete(`${path}/rewards/${trigger}`)
			} else {
				await http.put(`${path}/rewards/${trigger}`, {
					body: { entries: rows.map(fromChangeRow) },
				})
			}
		}
	},
}
