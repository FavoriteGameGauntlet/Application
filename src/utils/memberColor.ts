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

/** hue 0..360, saturation and value 0..1 */
export type Hsv = { h: number; s: number; v: number }

export const hexToHsv = (hex: string): Hsv => {
	const [r, g, b] = [1, 3, 5].map(
		(i) => parseInt(hex.slice(i, i + 2), 16) / 255,
	)
	const max = Math.max(r, g, b)
	const delta = max - Math.min(r, g, b)

	let h = 0

	if (delta > 0) {
		if (max === r) h = ((g - b) / delta + 6) % 6
		else if (max === g) h = (b - r) / delta + 2
		else h = (r - g) / delta + 4
	}

	return { h: h * 60, s: max === 0 ? 0 : delta / max, v: max }
}

export const hsvToHex = ({ h, s, v }: Hsv) => {
	const channel = (n: number) => {
		const k = (n + h / 60) % 6
		const value = v - v * s * Math.max(0, Math.min(k, 4 - k, 1))

		return Math.round(value * 255)
			.toString(16)
			.padStart(2, '0')
	}

	return `#${channel(5)}${channel(3)}${channel(1)}`
}
