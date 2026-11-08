import type { Api, RewardRow } from '../contracts'
import { http } from '../http'
import type { NamedChangeEntryDto } from './changeEntry'
import { partyPath } from './context'
import { fromChangeRow, toChangeRow } from './rows'

type Trigger = 'timer' | 'game'

const triggers: Trigger[] = ['timer', 'game']

const getRows = async (path: string, trigger: Trigger): Promise<RewardRow[]> =>
	(
		await http.get<{ response: { entries: NamedChangeEntryDto[] } }>(
			`${path}/rewards/${trigger}`,
		)
	).body.entries.map(toChangeRow)

const sameRows = (a: RewardRow[], b: RewardRow[]) =>
	JSON.stringify(a) === JSON.stringify(b)

export const adminRewards: Api['admin']['rewards'] = {
	get: async () => {
		const path = await partyPath()
		const [timer, game] = await Promise.all(
			triggers.map((t) => getRows(path, t)),
		)

		return { timer, game }
	},

	save: async (rewards) => {
		const path = await partyPath()
		const [timer, game] = await Promise.all(
			triggers.map((t) => getRows(path, t)),
		)
		const current = { timer, game }

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
