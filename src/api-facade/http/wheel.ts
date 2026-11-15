import type {
	Api,
	SpinPayment,
	WheelGroup,
	WheelSource,
	WheelSpinResult,
} from '../contracts'
import { http, type HttpErrorResponse } from '../http'
import {
	type NamedChangeEntryDto,
	toChangeText,
	toResourceRef,
} from './changeEntry'
import { currentLogin, getPointTypes, partyPath } from './context'
import { latestOwnEntry } from './journal'

type RolledWheelRowDto = {
	name: string
	description?: string
	isManualChange: boolean
	rolledDate: string
}

type WheelGroupDto = {
	id: number
	name: string
	kind: 'game' | 'changes' | 'wishlist'
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

const GROUP_KINDS = {
	game: 'games',
	changes: 'changes',
	wishlist: 'wishlist',
} as const

/** the backend names only the item that fell, the tape around it is the pool of the group */
const toSpinResult = (
	source: WheelSpinResult['source'],
	{ name, description, isManualChange }: RolledWheelRowDto,
	pool: string[],
): WheelSpinResult => {
	const index = pool.indexOf(name)
	// an item removed from the wheel after the spin is no longer in the pool
	const entries = index === -1 ? [...pool, name] : pool

	return {
		source,
		entries,
		resultIndex: index === -1 ? pool.length : index,
		result: {
			name,
			...(description !== undefined && { description }),
			isManualChange,
		},
	}
}

/** the backend names the lists by what they hold, the contract by the kind of the resource */
const toPaymentBody = ({ items, perks, effects }: SpinPayment) => ({
	userItemIds: items,
	perkIds: perks,
	userEffectIds: effects,
})

const getGroupRows = async (path: string, groupId: number) =>
	(
		await http.get<{ response: WheelGroupRowDto[] }>(
			`${path}/wheel/groups/${groupId}/rows`,
		)
	).body

/** the names on the tape: the items of the group, the games of the wishlist for a wishlist */
const getPoolNames = async (
	path: string,
	{ groupId, kind }: WheelSource,
): Promise<string[]> => {
	if (kind === 'wishlist') {
		const { body: games } = await http.get<{ response: { name: string }[] }>(
			`${path}/games/users/${await currentLogin()}/wishlist`,
		)

		return games.map((game) => game.name)
	}

	return (await getGroupRows(path, groupId)).map((row) => row.name)
}

const getGroups = async (): Promise<WheelGroup[]> => {
	const path = await partyPath()
	const [{ body: groups }, pointTypes] = await Promise.all([
		http.get<{ response: WheelGroupDto[] }>(`${path}/wheel/groups`),
		getPointTypes(),
	])

	return Promise.all(
		groups.map(async (group) => {
			// the items of a wishlist are not listed here, they are the wishlist games
			const rows =
				group.kind === 'wishlist' ? [] : await getGroupRows(path, group.id)

			return {
				id: group.id,
				name: group.name,
				kind: GROUP_KINDS[group.kind],
				entries: rows.map((row) => ({
					id: row.id,
					name: row.name,
					...(row.description !== undefined && {
						description: row.description,
					}),
					isManualChange: row.isManualChange === true,
					...(row.shouldApplyToAll !== undefined && {
						shouldApplyToAll: row.shouldApplyToAll,
					}),
					entries: (row.entries ?? []).map((entry) => ({
						...toResourceRef(entry),
						text: toChangeText(entry, pointTypes),
					})),
				})),
				cost: group.cost.map((entry) => {
					const ref = toResourceRef(entry)

					return { ...ref, amount: 'amount' in ref ? ref.amount : 1 }
				}),
			}
		}),
	)
}

const isLastSpinMissing = (e: unknown) =>
	(e as Partial<HttpErrorResponse>).body?.code ===
	'LAST_WHEEL_EFFECTS_NOT_FOUND'

export const wheel: Api['wheel'] = {
	groups: getGroups,

	spin: async (source) => {
		const path = await partyPath()
		const { body } = await http.post<{ response: RolledWheelRowDto }>(
			`${path}/wheel/spin`,
			{ body: { groupId: source.groupId } },
		)

		return toSpinResult(source, body, await getPoolNames(path, source))
	},

	lastSpin: async (source) => {
		const path = await partyPath()
		let row: RolledWheelRowDto

		try {
			row = (
				await http.get<{ response: RolledWheelRowDto }>(
					`${path}/wheel/groups/${source.groupId}/spins/last`,
				)
			).body
		} catch (e) {
			if (isLastSpinMissing(e)) return null

			throw e
		}

		return toSpinResult(source, row, await getPoolNames(path, source))
	},

	discard: async (groupId) => {
		await http.post(
			`${await partyPath()}/wheel/groups/${groupId}/spins/last/clear`,
		)
	},

	apply: async (groupId, { payment, targetLogins, entryIds } = {}) => {
		await http.post(
			`${await partyPath()}/wheel/groups/${groupId}/spins/last/apply`,
			{
				body: {
					...(entryIds && { entryIds }),
					...(targetLogins && { targetLogins }),
					...(payment && { payment: toPaymentBody(payment) }),
				},
			},
		)

		return { journalEntry: await latestOwnEntry() }
	},
}
