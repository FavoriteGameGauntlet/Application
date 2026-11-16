import type { UserItem } from '../api-facade/contracts'

/** how many copies of the item the user holds */
export const countItems = (items: UserItem[], itemId: number) =>
	items.filter((i) => i.itemId === itemId).length

/** the copies of the same item in one row, for the compact lists; the uses are summed over the copies */
export const groupItems = (items: UserItem[]) => {
	const groups = new Map<
		number,
		{
			itemId: number
			name: string
			count: number
			usesLeft: number
			usesMax: number
		}
	>()

	for (const { itemId, name, usesLeft, usesMax } of items) {
		const group = groups.get(itemId)

		if (group) {
			group.count += 1
			group.usesLeft += usesLeft
			group.usesMax += usesMax
		} else {
			groups.set(itemId, { itemId, name, count: 1, usesLeft, usesMax })
		}
	}

	return [...groups.values()]
}
