export type FormField = {
	key: string
	label: string
	/**
	 * a single line by default; `check` is a switch, `chips` picks several of
	 * `options` through a "+" link, `choice` picks one of `options` as a chip
	 */
	type?:
		| 'line'
		| 'area'
		| 'tags'
		| 'check'
		| 'select'
		| 'rows'
		| 'note'
		| 'color'
		| 'chips'
		| 'choice'
	placeholder?: string
	hint?: string
	/** for `select`, `chips` and `choice`; `hint` of an option is the line under it in the menu */
	options?: { value: string; label: string; hint?: string }[]
	/** for `rows`: which resources a row names and what its amount means */
	variant?: RowsVariant
	/** for `rows`: what the rows are for, shown while there are none */
	empty?: string
	/** for `rows` and `chips`: the text of the "+" link */
	addLabel?: string
	/** the field stays folded behind a "+ label" link until it has a value or is asked for */
	optional?: boolean
	/** the form does not save without it; the noun that the footer names ("название") */
	required?: string
	/** a digits-only line in the mono face */
	numeric?: boolean
	/** the width of the field in px; the field takes the whole line by default */
	width?: number
	/** the field is shown only while the `line`, `select` or `choice` field `key` holds `is` */
	when?: { key: string; is: string }
}

/**
 * A titled group of fields. In a group with `columns` (a CSS grid template) the
 * fields sit side by side and their labels are quiet.
 */
export type FormSection = {
	title?: string
	columns?: string
	fields: FormField[]
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
	/** the sign is the action: a minus takes away, no sign gives */
	amount: string
	who: 'self' | 'chosen'
}

/** `line`, `area`, `select`, `choice` and `color` give a string, `tags` and `chips` a list, `check` a flag, `rows` a list of rows */
export type FormValues = Record<string, string | string[] | boolean | FormRow[]>
