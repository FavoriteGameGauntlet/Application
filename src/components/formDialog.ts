export type FormField = {
	key: string
	label: string
	/**
	 * a single line by default; `check` is a switch, `chips` picks several of
	 * `options` through a "+" link, `choice` picks one of `options` as a chip,
	 * `segment` picks one of `options` in a segmented control (for the `aside`
	 * of a section), `span` is a length as a number and a unit (its value is
	 * the seconds), `dates` is a period of days (its value is «2026-11-01/2026-11-30»,
	 * both days included), `locked` shows `lines` that cannot be edited, `arrow` is
	 * a sign between two columns and holds no value, `pick` picks some of `options`
	 * from a list of rows (the value is the picked `value`s), `rating` is a mark
	 * from 1 to 10 (its value is the number as a string)
	 */
	type?:
		| 'line'
		| 'area'
		| 'tags'
		| 'check'
		| 'select'
		| 'rows'
		| 'color'
		| 'chips'
		| 'choice'
		| 'segment'
		| 'span'
		| 'dates'
		| 'locked'
		| 'arrow'
		| 'pick'
		| 'rating'
	placeholder?: string
	hint?: string
	/** the `hint` names why the form cannot be filled yet, so it is red */
	invalid?: boolean
	/**
	 * for `select`, `chips`, `choice` and `pick`; `hint` of an option is the line
	 * under it in the menu, `meta` is the quiet text at the end of a `pick` row,
	 * `color` makes a `pick` row start with the avatar of a player
	 */
	options?: {
		value: string
		label: string
		hint?: string
		meta?: string
		color?: string
		/** a `pick` row that is shown but cannot be picked */
		disabled?: boolean
	}[]
	/** for `pick`: exactly this many are picked; 1 makes it a choice of one. Without it any number from one up */
	limit?: number
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
	/** `required` does not count while the `check` field `key` is `is`: the field is one of two ways to fill the form */
	requiredUnless?: { key: string; is: string | boolean }
	/** a digits-only line in the mono face */
	numeric?: boolean
	/** the width of the field in px; the field takes the whole line by default */
	width?: number
	/** in a section with `columns`: the column the field sits in, counted from 1; the next free one by default */
	column?: number
	/** for `locked` */
	lines?: string[]
	/** the field is shown only while the `check` field `key` is `is`, or the `line`, `select`, `choice` or `segment` field holds `is` */
	when?: { key: string; is: string | boolean }
}

/**
 * A titled group of fields. In a group with `columns` (a CSS grid template) the
 * fields sit side by side and their labels are quiet. `aside` sits at the end
 * of the title line. A section with no shown field and no `aside` is hidden.
 * With `FormDialog.tabs` the section belongs to the tab `tab`, the first by default.
 */
export type FormSection = {
	title?: string
	columns?: string
	aside?: FormField
	tab?: string
	fields: FormField[]
}

/**
 * A tab of a form. The tab is shown while its `when` holds; the bar is shown
 * while there is more than one tab. A red dot on the tab means that a shown
 * field of it with `required` is empty.
 */
export type FormTab = {
	key: string
	label: string
	/** the tab can be read, not edited */
	locked?: boolean
	when?: { key: string; is: string | boolean }
}

/**
 * `change`: any resource, the amount keeps the sign. `cost`: any resource, the
 * amount is positive. `item-entry`: like `change`, plus a chosen item copy and
 * whom the row acts on. `modifier`: a point type only, the amount keeps the sign.
 */
export type RowsVariant = 'change' | 'cost' | 'item-entry' | 'modifier'

/** a row of a `rows` field as the user types it */
export type FormRow = {
	/** `points`, `item`, `perk`, `effect`, `user-item` or `user-item-transfer` */
	kind: string
	/** the id of the point type, item, perk or effect */
	targetId: string
	/** the sign is the action: a minus takes away, no sign gives */
	amount: string
	who: 'self' | 'chosen'
}

/** `line`, `area`, `select`, `choice`, `segment`, `span`, `dates`, `color` and `rating` give a string, `tags`, `chips` and `pick` a list, `check` a flag, `rows` a list of rows */
export type FormValues = Record<string, string | string[] | boolean | FormRow[]>
