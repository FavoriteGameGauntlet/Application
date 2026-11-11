import type { AdminWheelGroup, Api, PointType, SpinCostRow } from '../contracts'
import { http } from '../http'
import { type NamedChangeEntryDto, toChangeText } from './changeEntry'
import { getPointTypes, partyPath } from './context'
import { fromChangeRow, fromCostRow, toChangeRow } from './rows'

type WheelGroupDto = {
	id: number
	name: string
	kind: 'game' | 'changes' | 'wishlist'
	/** an item the user has already seen is left out of their next spins */
	shouldCheckHistory: boolean
	/** what one spin costs, the amounts are negative */
	cost: NamedChangeEntryDto[]
}

type WheelGroupRowDto = {
	id: number
	name: string
	description?: string
	isManualChange?: boolean
	shouldApplyToAll?: boolean
	entries?: NamedChangeEntryDto[]
}

const groupKind = {
	games: 'game',
	changes: 'changes',
} as const satisfies Record<AdminWheelGroup['kind'], WheelGroupDto['kind']>

/** the groups of games and of changes of the party, the wishlists are not in the catalogue */
const listGroups = async () =>
	(
		await http.get<{ response: WheelGroupDto[] }>(
			`${await partyPath()}/wheel/catalog/groups`,
		)
	).body

const findGroup = async (groupId: number) => {
	const group = (await listGroups()).find((g) => g.id === groupId)

	if (!group) throw new Error('The wheel group is not found')

	return group
}

const toAdminGroup = (
	group: WheelGroupDto,
	rows: WheelGroupRowDto[],
	pointTypes: PointType[],
): AdminWheelGroup => ({
	id: group.id,
	name: group.name,
	kind: group.kind === 'changes' ? 'changes' : 'games',
	system: group.kind === 'wishlist',
	noRepeat: group.shouldCheckHistory,
	entries: rows.map((row) => ({
		id: row.id,
		name: row.name,
		...(row.description !== undefined && { description: row.description }),
		changes: (row.entries ?? []).map((e) => toChangeText(e, pointTypes)),
		entries: (row.entries ?? []).map(toChangeRow),
		isManualChange: row.isManualChange === true,
		shouldApplyToAll: row.shouldApplyToAll !== false,
	})),
})

const changeGroup = async (
	groupId: number,
	patch: Partial<Pick<WheelGroupDto, 'name' | 'shouldCheckHistory'>>,
) => {
	const { name, shouldCheckHistory } = await findGroup(groupId)

	await http.put(`${await partyPath()}/wheel/catalog/groups/${groupId}`, {
		body: { name, shouldCheckHistory, ...patch },
	})
}

const toSpinCostRow = (entry: NamedChangeEntryDto): SpinCostRow => {
	const amount = Math.abs(entry.amount)

	if (entry.pointTypeId != null) {
		return { kind: 'points', targetId: entry.pointTypeId, amount }
	}

	if (entry.itemId != null)
		return { kind: 'item', targetId: entry.itemId, amount }
	if (entry.perkId != null)
		return { kind: 'perk', targetId: entry.perkId, amount }
	if (entry.effectId != null) {
		return { kind: 'effect', targetId: entry.effectId, amount }
	}

	throw new Error('A spin cost entry has no target')
}

export const adminWheel: Pick<
	Api['admin']['wheel'],
	| 'groups'
	| 'createGroup'
	| 'renameGroup'
	| 'setNoRepeat'
	| 'removeGroup'
	| 'saveEntry'
	| 'removeEntry'
	| 'spinCost'
	| 'saveSpinCost'
> = {
	groups: async (kind) => {
		const path = await partyPath()
		const [catalog, mine, pointTypes] = await Promise.all([
			listGroups(),
			// the catalogue has no wishlists, the admin sees their own one as a group nobody edits
			kind === 'games'
				? http.get<{ response: WheelGroupDto[] }>(`${path}/wheel/groups`)
				: undefined,
			getPointTypes(),
		])
		const wishlists = (mine?.body ?? []).filter((g) => g.kind === 'wishlist')

		return Promise.all(
			[...wishlists, ...catalog]
				.filter((g) => (g.kind === 'changes') === (kind === 'changes'))
				.map(async (group) => {
					// the wishlist is the player's own, the catalogue has no rows of it (404)
					if (group.kind === 'wishlist')
						return toAdminGroup(group, [], pointTypes)

					const { body: rows } = await http.get<{
						response: WheelGroupRowDto[]
					}>(`${path}/wheel/catalog/groups/${group.id}/rows`)

					return toAdminGroup(group, rows, pointTypes)
				}),
		)
	},

	createGroup: async (kind, name) => {
		const { body } = await http.post<{ response: WheelGroupDto }>(
			`${await partyPath()}/wheel/catalog/groups`,
			{
				body: {
					name,
					kind: groupKind[kind],
					shouldCheckHistory: false,
					cost: [],
				},
			},
		)

		return toAdminGroup(body, [], [])
	},

	renameGroup: (groupId, name) => changeGroup(groupId, { name }),

	setNoRepeat: (groupId, noRepeat) =>
		changeGroup(groupId, { shouldCheckHistory: noRepeat }),

	removeGroup: async (groupId) => {
		await http.delete(`${await partyPath()}/wheel/catalog/groups/${groupId}`)
	},

	saveEntry: async (groupId, entryId, input) => {
		const { kind } = await findGroup(groupId)
		const { name, description, isManualChange, shouldApplyToAll, entries } =
			input
		const path = `${await partyPath()}/wheel/catalog/groups/${groupId}/rows`

		// a group of games takes only the name of the game
		const body =
			kind === 'changes'
				? {
						name,
						...(description && { description }),
						isManualChange,
						shouldApplyToAll,
						entries: entries.map(fromChangeRow),
					}
				: { name }

		if (entryId === undefined) {
			await http.post(path, { body })
		} else {
			// the item is replaced as a whole, the same body as when it is added
			await http.put(`${path}/${entryId}`, { body })
		}
	},

	removeEntry: async (groupId, entryId) => {
		await http.delete(
			`${await partyPath()}/wheel/catalog/groups/${groupId}/rows/${entryId}`,
		)
	},

	spinCost: async (groupId) =>
		(await findGroup(groupId)).cost.map(toSpinCostRow),

	saveSpinCost: async (groupId, rows) => {
		await http.put(
			`${await partyPath()}/wheel/catalog/groups/${groupId}/spin-cost`,
			{ body: { cost: rows.map(fromCostRow) } },
		)
	},
}
