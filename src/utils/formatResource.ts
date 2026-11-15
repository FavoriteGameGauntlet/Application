import type {
	PointType,
	Reward,
	ResourceRef,
	SpinCostRef,
} from '../api-facade/contracts'
import { plural } from './plural'

/** «80 золота», «Щит ×2», «перк Коллекционер» */
export const formatResource = (ref: ResourceRef, pointTypes: PointType[]) => {
	switch (ref.kind) {
		case 'points': {
			const type = pointTypes.find((t) => t.id === ref.id)

			return `${ref.amount} ${type ? plural(ref.amount, [type.unitForms.one, type.unitForms.several, type.unitForms.many]) : ref.name.toLowerCase()}`
		}
		case 'item':
			return ref.amount > 1 ? `${ref.name} ×${ref.amount}` : ref.name
		case 'perk':
			return `перк ${ref.name}`
		case 'effect':
			return ref.name
	}
}

/** «осталось 2 из 3»: what an item copy has left */
export const formatUsesLeft = (item: { usesLeft: number; usesMax: number }) =>
	`осталось ${item.usesLeft} из ${item.usesMax}`

/** «50 золота», «Щит ×2», «перк Коллекционер», «Благословение ×2» */
export const formatCost = (cost: SpinCostRef, pointTypes: PointType[]) => {
	if (cost.kind === 'points' || cost.kind === 'item')
		return formatResource(cost, pointTypes)

	const text = formatResource(
		{ kind: cost.kind, id: cost.id, name: cost.name },
		pointTypes,
	)

	return cost.amount > 1 ? `${text} ×${cost.amount}` : text
}

/** one fact of a change as a plate: green adds, red takes */
export type Change = { text: string; tone: 'plus' | 'minus' }

/** «+50 золота» is green, «−Щит» is red; the sign is the only thing a reward row says about it */
export const rewardChanges = (reward: Reward): Change[] =>
	reward.map((r) => ({
		text: `${r.value} ${r.label}`,
		tone: r.value.startsWith('−') ? 'minus' : 'plus',
	}))
