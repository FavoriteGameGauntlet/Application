import type { systemParameters } from '../constants/systemParameters'

export type SystemParameterName = keyof typeof systemParameters

export type SystemParameterType<K extends SystemParameterName> = ReturnType<
	(typeof systemParameters)[K]
>
