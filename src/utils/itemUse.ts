import type {
	ItemCondition,
	ItemEntryRow,
	Login,
	Member,
} from '../api-facade/contracts'

/** the copies the user picks for one entry, for one user it acts on */
export type UseSlot = {
	/** whose inventory the copies are taken from, or the whole party */
	owner: Login | 'party'
	/** a catalogue item the copies have to be of; undefined = a copy of any item */
	itemId?: number
	/** how many copies the entry takes or duplicates */
	count: number
}

/** an entry that acts on the chosen users needs them named */
export const needsTargets = (entries: ItemEntryRow[]) =>
	entries.some((e) => e.who === 'chosen')

/**
 * The copies the entries take or duplicate, in the order of the entries. An
 * entry with a negative amount takes its copies from each user it acts on in
 * turn, in the order of `targets`; a positive amount of a user item duplicates
 * copies taken from any inventory of the party.
 */
export const useSlots = (
	entries: ItemEntryRow[],
	holder: Login,
	targets: Login[],
): UseSlot[] =>
	entries.flatMap<UseSlot>((entry) => {
		const count = Math.abs(entry.amount)

		if (entry.kind === 'user-item' && entry.amount > 0) {
			return [{ owner: 'party', count }]
		}

		const takesCopies =
			entry.amount < 0 && (entry.kind === 'user-item' || entry.kind === 'item')

		if (!takesCopies) return []

		const owners = entry.who === 'chosen' ? targets : [holder]

		return owners.map((owner) => ({
			owner,
			count,
			...(entry.kind === 'item' && { itemId: entry.targetId }),
		}))
	})

/** the use needs a form when the user picks the entries, names targets or picks copies */
export const needsUseForm = (
	entries: ItemEntryRow[] | undefined,
	holder: Login,
	shouldApplyToAll = true,
) =>
	!!entries &&
	(!shouldApplyToAll ||
		needsTargets(entries) ||
		useSlots(entries, holder, []).length > 0)

/** the entries a use applies: all of them, or the ones the user picked by `entryId` */
export const appliedEntries = (
	entries: ItemEntryRow[],
	shouldApplyToAll: boolean,
	pickedIds: number[],
) =>
	shouldApplyToAll
		? entries
		: entries.filter(
				(e) => e.entryId !== undefined && pickedIds.includes(e.entryId),
			)

/** whom the holder may name, by the conditions of the item */
export const allowedTargets = (
	members: Member[],
	holder: Login,
	conditions: ItemCondition[] = [],
) =>
	members.filter((m) => {
		if (conditions.includes('target_not_self') && m.user.login === holder)
			return false
		if (conditions.includes('target_online') && m.status === 'offline')
			return false
		if (conditions.includes('target_offline') && m.status !== 'offline')
			return false

		return true
	})
