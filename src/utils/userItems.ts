import type { UserItem } from '../api-facade/contracts'

/** how many copies of the item the user holds */
export const countItems = (items: UserItem[], itemId: number) =>
	items.filter((i) => i.itemId === itemId).length

/** the copies of the same item in one row, for the compact lists */
export const groupItems = (items: UserItem[]) => {
	const groups = new Map<number, { itemId: number; name: string; count: number }>()

	for (const { itemId, name } of items) {
		const group = groups.get(itemId)

		if (group) {
			group.count += 1
		} else {
			groups.set(itemId, { itemId, name, count: 1 })
		}
	}

	return [...groups.values()]
}
