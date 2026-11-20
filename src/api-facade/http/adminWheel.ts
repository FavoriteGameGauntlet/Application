import type { Api, WheelCatalogGroup } from '../contracts'
import { http } from '../http'
import { getPointTypes, partyPath } from './context'
import { fromChangeRow, fromCostRow } from './rows'
import {
	type WheelCatalogGroupDto,
	getCatalogGroups,
	toCatalogGroup,
	wheel,
} from './wheel'

const groupKind = {
	games: 'game',
	changes: 'changes',
} as const satisfies Record<
	WheelCatalogGroup['kind'],
	WheelCatalogGroupDto['kind']
>

const findGroup = async (groupId: number) => {
	const group = (await getCatalogGroups()).find((g) => g.id === groupId)

	if (!group) throw new Error('The wheel group is not found')

	return group
}

const changeGroup = async (
	groupId: number,
	patch: Partial<Pick<WheelCatalogGroupDto, 'name' | 'shouldCheckHistory'>>,
) => {
	const { name, shouldCheckHistory } = await findGroup(groupId)

	await http.put(`${await partyPath()}/wheel/catalog/groups/${groupId}`, {
		body: { name, shouldCheckHistory, ...patch },
	})
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
	| 'saveSpinCost'
> = {
	groups: async (kind) => {
		if (kind === 'changes') return wheel.catalog(kind)

		const path = await partyPath()
		const [catalog, mine, pointTypes] = await Promise.all([
			wheel.catalog(kind),
			// the catalogue has no wishlists, the admin sees their own one as a group nobody edits
			http.get<{ response: WheelCatalogGroupDto[] }>(`${path}/wheel/groups`),
			getPointTypes(),
		])
		const wishlists = mine.body
			.filter((g) => g.kind === 'wishlist')
			.map((g) => toCatalogGroup(g, [], pointTypes))

		return [...wishlists, ...catalog]
	},

	createGroup: async (kind, name) => {
		const { body } = await http.post<{ response: WheelCatalogGroupDto }>(
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

		return toCatalogGroup(body, [], [])
	},

	renameGroup: (groupId, name) => changeGroup(groupId, { name }),

	setNoRepeat: (groupId, noRepeat) =>
		changeGroup(groupId, { shouldCheckHistory: noRepeat }),

	removeGroup: async (groupId) => {
		await http.delete(`${await partyPath()}/wheel/catalog/groups/${groupId}`)
	},

	saveEntry: async (groupId, entryId, input) => {
		const { kind } = await findGroup(groupId)
		const { name, description, isManualChange, applyMode, entries } = input
		const path = `${await partyPath()}/wheel/catalog/groups/${groupId}/rows`

		// a group of games takes only the name of the game
		const body =
			kind === 'changes'
				? {
						name,
						...(description && { description }),
						isManualChange,
						applyMode,
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

	saveSpinCost: async (groupId, rows) => {
		await http.put(
			`${await partyPath()}/wheel/catalog/groups/${groupId}/spin-cost`,
			{ body: { cost: rows.map(fromCostRow) } },
		)
	},
}
