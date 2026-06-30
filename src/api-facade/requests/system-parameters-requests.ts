import type { SystemParameter } from '../models/system-parameters-models.ts'

export type GetSystemParameter = {
	request: {
		path: {
			name: string
		}
	}
	response: SystemParameter
}

export type GetAllSystemParameters = {
	response: SystemParameter[]
}
