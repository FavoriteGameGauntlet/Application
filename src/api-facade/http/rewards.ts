import type { Reward, RewardTrigger } from '../contracts'
import { http } from '../http'
import {
	entryName,
	type NamedChangeEntryDto,
	signedAmount,
} from './changeEntry'
import { partyPath } from './context'

export const getReward = async (trigger: RewardTrigger): Promise<Reward> =>
	(
		await http.get<{ response: { entries: NamedChangeEntryDto[] } }>(
			`${await partyPath()}/rewards/${trigger}`,
		)
	).body.entries.map((entry) => ({
		label: entryName(entry),
		value: signedAmount(entry.amount),
	}))
