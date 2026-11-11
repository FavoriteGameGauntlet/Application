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
	/** how many copies the entry takes, duplicates or moves */
	count: number
	/** the player the copies are moved to; set on a transfer only */
	receiver?: Login
}

export const isTransfer = (entry: ItemEntryRow) =>
	entry.kind === 'user-item-transfer'

/** an entry that acts on the chosen users, or a transfer, needs them named */
export const needsTargets = (entries: ItemEntryRow[]) =>
	entries.some((e) => e.who === 'chosen' || isTransfer(e))

/**
 * The copies the entries take, duplicate or move, in the order of the entries.
 * An entry with a negative amount, or a transfer, takes its copies for each
 * chosen user in turn, in the order of `targets`; a positive amount of a user
 * item duplicates copies taken from any inventory of the party. A transfer
 * takes from the holder (`self`) and gives to the chosen players, or takes from
 * the chosen players and gives to the holder.
 */
export const useSlots = (
	entries: ItemEntryRow[],
	holder: Login,
	targets: Login[],
): UseSlot[] =>
	entries.flatMap<UseSlot>((entry) => {
		const count = Math.abs(entry.amount)

		if (isTransfer(entry)) {
			return targets.map((target) =>
				entry.who === 'chosen'
					? { owner: target, count, receiver: holder }
					: { owner: holder, count, receiver: target },
			)
		}

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

/** whom the holder may name, by the conditions of the item; a transfer never names the holder */
export const allowedTargets = (
	members: Member[],
	holder: Login,
	conditions: ItemCondition[] = [],
	transfers = false,
) =>
	members.filter((m) => {
		if (
			(transfers || conditions.includes('target_not_self')) &&
			m.user.login === holder
		)
			return false
		if (conditions.includes('target_online') && m.status === 'offline')
			return false
		if (conditions.includes('target_offline') && m.status !== 'offline')
			return false

		return true
	})
