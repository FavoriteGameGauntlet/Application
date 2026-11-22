import type { SystemParameter } from '../api-facade/contracts'

/** the wheel needs a middle item, which the bounds of the backend cannot say */
const ODD_PARAMETER_CODE = 'MinimumAvailableWheelEffectsForRoll'

/** what is wrong with the value as a sentence, or nothing when it can be sent */
export const checkParameterValue = (
	parameter: SystemParameter,
	value: string,
): string | undefined => {
	if (parameter.type === 'bool')
		return value === 'true' || value === 'false'
			? undefined
			: 'Значение должно быть «да» или «нет»'

	if (!/^-?\d+$/.test(value)) return 'Значение должно быть целым числом'

	const number = Number(value)

	if (parameter.minValue !== null && number < parameter.minValue)
		return `Значение должно быть не меньше ${parameter.minValue}`

	if (parameter.maxValue !== null && number > parameter.maxValue)
		return `Значение должно быть не больше ${parameter.maxValue}`

	if (parameter.code === ODD_PARAMETER_CODE && number % 2 === 0)
		return 'Значение должно быть нечётным'

	return undefined
}

/** the bounds as a short text for the admin, or nothing when there are none */
export const parameterRange = (parameter: SystemParameter) => {
	const { minValue, maxValue } = parameter

	if (parameter.type === 'bool') return undefined
	if (minValue !== null && maxValue !== null)
		return `от ${minValue} до ${maxValue}`
	if (minValue !== null) return `от ${minValue}`
	if (maxValue !== null) return `до ${maxValue}`

	return undefined
}
