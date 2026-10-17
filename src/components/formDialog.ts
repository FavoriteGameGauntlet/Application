export type FormField = {
	key: string
	label: string
	/** a single line by default */
	type?: 'line' | 'area' | 'tags' | 'check' | 'select'
	placeholder?: string
	hint?: string
	/** for `select` */
	options?: { value: string; label: string }[]
}

/** `line`, `area` and `select` give a string, `tags` a list, `check` a flag */
export type FormValues = Record<string, string | string[] | boolean>
