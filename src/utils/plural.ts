export const plural = (
	n: number,
	[one, few, many]: [string, string, string],
) => {
	const abs = Math.abs(n)

	if (abs % 10 === 1 && abs % 100 !== 11) return one
	if (abs % 10 >= 2 && abs % 10 <= 4 && (abs % 100 < 12 || abs % 100 > 14)) {
		return few
	}

	return many
}
