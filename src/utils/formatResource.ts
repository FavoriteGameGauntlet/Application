import type { PointType, ResourceRef, SpinCostRef } from '../api-facade/contracts'
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

/** «50 золота», «Щит ×2», «перк Коллекционер», «Благословение ×2» */
export const formatCost = (cost: SpinCostRef, pointTypes: PointType[]) => {
	if (cost.kind === 'points' || cost.kind === 'item') return formatResource(cost, pointTypes)

	const text = formatResource({ kind: cost.kind, id: cost.id, name: cost.name }, pointTypes)

	return cost.amount > 1 ? `${text} ×${cost.amount}` : text
}
