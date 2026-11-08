import type { Api } from '../contracts'
import { http } from '../http'

export const presence: Api['presence'] = {
	ping: async () => {
		await http.post('/presence/ping')
	},
}
