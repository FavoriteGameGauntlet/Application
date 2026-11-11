import { MEMBER_COLORS } from '../constants/memberColors'

const MEMBER_COLOR_PATTERN = /^#[0-9a-f]{6}$/

/** the backend takes a lowercase `#rrggbb` only */
export const isMemberColor = (value: string) => MEMBER_COLOR_PATTERN.test(value)

/**
 * The color a new member gets by default: the palette color that fewest of the
 * given ones use, the earliest of them when several are equally free. The
 * backend allows repeats, so a full party simply starts the palette again.
 */
export const nextMemberColor = (used: string[]) => {
	const count = (color: string) => used.filter((u) => u === color).length

	return MEMBER_COLORS.reduce((best, color) =>
		count(color) < count(best) ? color : best,
	)
}
