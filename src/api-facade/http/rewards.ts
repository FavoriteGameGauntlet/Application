import type { Reward } from '../contracts'
import { http } from '../http'
import {
	entryName,
	type NamedChangeEntryDto,
	signedAmount,
} from './changeEntry'
import { partyPath } from './context'

/** `timer`: a timer of a user ends; `game`: a user finishes their current game */
type RewardTrigger = 'timer' | 'game'

export const getReward = async (trigger: RewardTrigger): Promise<Reward> =>
	(
		await http.get<{ response: { entries: NamedChangeEntryDto[] } }>(
			`${await partyPath()}/rewards/${trigger}`,
		)
	).body.entries.map((entry) => ({
		label: entryName(entry),
		value: signedAmount(entry.amount),
	}))
