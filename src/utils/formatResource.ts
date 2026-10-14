import type { PointType, ResourceRef } from '../api-facade/contracts'
import { plural } from './plural'

/** «80 золота», «Щит ×2», «перк Коллекционер» */
export const formatResource = (ref: ResourceRef, pointTypes: PointType[]) => {
	switch (ref.kind) {
		case 'points': {
			const type = pointTypes.find((t) => t.name === ref.type)

			return `${ref.amount} ${type ? plural(ref.amount, type.unitForms) : ref.type.toLowerCase()}`
		}
		case 'item':
			return ref.amount > 1 ? `${ref.name} ×${ref.amount}` : ref.name
		case 'perk':
			return `перк ${ref.name}`
		case 'effect':
			return ref.name
	}
}
