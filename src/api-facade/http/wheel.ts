import type { Api, SpinPayment, WheelSpinResult } from '../contracts'
import { http } from '../http'
import { partyPath } from './context'
import { latestOwnEntry } from './journal'

type RolledWheelRowDto = {
	name: string
	description?: string
	isManualChange: boolean
	/** the place on the wheel, counted from 1 */
	position: number
	rolledDate: string
}

type WheelGroupDto = { id: number; kind: 'game' | 'changes' | 'wishlist' }

/** the wishlist is a group of its own on the backend, with one per member */
const groupIdOf = async (
	source: Parameters<Api['wheel']['spin']>[0],
	path: string,
) => {
	if (source !== 'wishlist') return source.groupId

	const { body } = await http.get<{ response: WheelGroupDto[] }>(
		`${path}/wheel/groups`,
	)
	const wishlist = body.find((g) => g.kind === 'wishlist')

	if (!wishlist) throw new Error('The wishlist group is not found')

	return wishlist.id
}

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

export const wheel: Pick<Api['wheel'], 'spin' | 'apply'> = {
	spin: async (source) => {
		const path = await partyPath()
		const { body } = await http.post<{ response: RolledWheelRowDto[] }>(
			`${path}/wheel/spin`,
			{ body: { groupId: await groupIdOf(source, path) } },
		)

		return toSpinResult(source, body)
	},

	apply: async (payment, targetLogins) => {
		await http.post(`${await partyPath()}/wheel/spins/last/apply`, {
			body: {
				...(targetLogins && { targetLogins }),
				...(payment && { payment: toPaymentBody(payment) }),
			},
		})

		return { journalEntry: await latestOwnEntry() }
	},
}
