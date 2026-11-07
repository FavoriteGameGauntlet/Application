export type FormField = {
	key: string
	label: string
	/** a single line by default */
	type?: 'line' | 'area' | 'tags' | 'check' | 'select' | 'rows'
	placeholder?: string
	hint?: string
	/** for `select` */
	options?: { value: string; label: string }[]
	/** for `rows`: which resources a row names and what its amount means */
	variant?: RowsVariant
}

/**
 * `change`: any resource, the amount keeps the sign. `cost`: any resource, the
 * amount is positive. `item-entry`: like `change`, plus a chosen item copy and
 * whom the row acts on. `modifier`: a point type only, the amount keeps the sign.
 */
export type RowsVariant = 'change' | 'cost' | 'item-entry' | 'modifier'

/** a row of a `rows` field as the user types it */
export type FormRow = {
	/** `points`, `item`, `perk`, `effect` or `user-item` */
	kind: string
	/** the id of the point type, item, perk or effect */
	targetId: string
	amount: string
	who: 'self' | 'chosen'
}

/** `line`, `area` and `select` give a string, `tags` a list, `check` a flag, `rows` a list of rows */
export type FormValues = Record<string, string | string[] | boolean | FormRow[]>
