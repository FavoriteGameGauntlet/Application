import { formatResource } from '../../utils/formatResource'
import type { JournalEntry, ResourceRef } from '../contracts'
import * as db from './db'
import { newId, now } from './helpers'

export const text = (ref: ResourceRef) => formatResource(ref, db.pointTypes)

/** «+50 золота», «−1 билет», «+перк Коллекционер» */
export const signedText = (ref: ResourceRef) => {
	if (!('amount' in ref)) return `+${text(ref)}`

	const sign = ref.amount < 0 ? '−' : '+'

	return `${sign}${text({ ...ref, amount: Math.abs(ref.amount) })}`
}

export const pushJournal = (
	source: JournalEntry['source'],
	manual: boolean,
	changes: JournalEntry['changes'],
	correctsEntryId?: number,
): JournalEntry => {
	const entry: JournalEntry = {
		id: newId(),
		at: now(),
		actor: db.ME,
		source,
		manual,
		changes,
		...(correctsEntryId !== undefined && { correctsEntryId }),
	}

	db.journal.unshift(entry)
	return entry
}
