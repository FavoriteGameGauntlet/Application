import type { Api, SystemParameter } from '../contracts'
import { http } from '../http'
import { partyPath } from './context'

export const adminParameters: Api['admin']['parameters'] = {
	list: async () =>
		(
			await http.get<{ response: SystemParameter[] }>(
				`${await partyPath()}/system-parameters`,
			)
		).body,

	save: async (code, value) => {
		await http.post(`${await partyPath()}/system-parameters/${code}`, {
			body: { value },
		})
	},

	reset: async (code) => {
		await http.delete(`${await partyPath()}/system-parameters/${code}`)
	},
}
