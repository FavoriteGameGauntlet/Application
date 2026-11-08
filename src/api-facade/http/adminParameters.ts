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

	save: async (name, value) => {
		await http.post(`${await partyPath()}/system-parameters/${name}`, {
			body: { value },
		})
	},

	reset: async (name) => {
		await http.delete(`${await partyPath()}/system-parameters/${name}`)
	},
}
