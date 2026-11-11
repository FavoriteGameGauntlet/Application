import type {
	Api,
	SpinPayment,
	WheelGroup,
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
	/** the place on the wheel, counted from 1 */
	position: number
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

/** the spin has an odd number of items, the middle one is applied */
const toSpinResult = (
	source: WheelSpinResult['source'],
	rows: RolledWheelRowDto[],
): WheelSpinResult => {
	const ordered = [...rows].sort((a, b) => a.position - b.position)
	const resultIndex = Math.floor(ordered.length / 2)
	const { name, description, isManualChange } = ordered[resultIndex]

	return {
		source,
		entries: ordered.map((row) => row.name),
		resultIndex,
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
				group.kind === 'wishlist'
					? []
					: (
							await http.get<{ response: WheelGroupRowDto[] }>(
								`${path}/wheel/groups/${group.id}/rows`,
							)
						).body

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
		const { body } = await http.post<{ response: RolledWheelRowDto[] }>(
			`${path}/wheel/spin`,
			{ body: { groupId: source.groupId } },
		)

		return toSpinResult(source, body)
	},

	lastSpin: async () => {
		const path = await partyPath()
		let rows: RolledWheelRowDto[]

		try {
			rows = (
				await http.get<{ response: RolledWheelRowDto[] }>(
					`${path}/wheel/spins/last`,
				)
			).body
		} catch (e) {
			if (isLastSpinMissing(e)) return null

			throw e
		}

		// the answer doesn't name the group, so it is the one that holds every name of the spin
		const [groups, wishlist] = await Promise.all([
			getGroups(),
			http.get<{ response: { name: string }[] }>(
				`${path}/games/users/${await currentLogin()}/wishlist`,
			),
		])
		const names = rows.map((row) => row.name)
		const group = groups.find((g) => {
			const pool =
				g.kind === 'wishlist'
					? wishlist.body.map((game) => game.name)
					: g.entries.map((entry) => entry.name)

			return names.every((name) => pool.includes(name))
		})

		return group ? toSpinResult({ groupId: group.id }, rows) : null
	},

	discard: async () => {
		await http.post(`${await partyPath()}/wheel/spins/last/clear`)
	},

	apply: async ({ payment, targetLogins, entryIds } = {}) => {
		await http.post(`${await partyPath()}/wheel/spins/last/apply`, {
			body: {
				...(entryIds && { entryIds }),
				...(targetLogins && { targetLogins }),
				...(payment && { payment: toPaymentBody(payment) }),
			},
		})

		return { journalEntry: await latestOwnEntry() }
	},
}
