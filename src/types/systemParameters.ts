import type { systemParameterDefs } from '../constants/systemParameters'

export type SystemParameterName = keyof typeof systemParameterDefs

export type SystemParameterType<K extends SystemParameterName> = ReturnType<
	(typeof systemParameterDefs)[K]['convert']
>
