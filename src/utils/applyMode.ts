import type { ApplyMode } from '../api-facade/contracts'

/** the names of the modes, as the segment of a section header and the facts of a row show them */
export const applyModeLabels: Record<ApplyMode, string> = {
	all: 'Все',
	any: 'Несколько',
	one: 'Одна',
}

/** the options of the segment that sets the mode in an admin form */
export const applyModeOptions = (
	Object.keys(applyModeLabels) as ApplyMode[]
).map((value) => ({ value, label: applyModeLabels[value] }))

/** the user picks the entries to apply, not all of them are applied */
export const picksEntries = (mode: ApplyMode | undefined) =>
	mode !== undefined && mode !== 'all'

/** how many entries the user may pick: one, or any number from one up */
export const pickLimit = (mode: ApplyMode | undefined) =>
	mode === 'one' ? 1 : undefined

/** the picked entries are enough for a use in this mode */
export const isPickComplete = (mode: ApplyMode | undefined, picked: number[]) =>
	!picksEntries(mode) ||
	(mode === 'one' ? picked.length === 1 : picked.length > 0)

/** the mode as a quiet fact of a row: nothing when every entry applies */
export const applyModeFacts: Record<ApplyMode, string | undefined> = {
	all: undefined,
	any: 'на выбор',
	one: 'одна на выбор',
}

/** the mode as a line of a catalogue card */
export const applyModeLines: Record<ApplyMode, string> = {
	all: 'Все строки применяются сразу',
	any: 'Игрок сам отмечает, какие строки применить',
	one: 'Игрок выбирает одну строку',
}
