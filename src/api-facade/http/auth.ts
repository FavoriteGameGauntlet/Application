import { persistentStorage, StoreKey } from '../../services/persistentStorage'
import type { Api } from '../contracts'
import { http } from '../http'

export const auth: Api['auth'] = {
	signUp: async ({ login, email, password }) => {
		await http.post('/auth/signup', { body: { login, email, password } })
	},

	logIn: async ({ login, password }) => {
		await http.post('/auth/login', { body: { login, password } })
		// a new session starts without a party, the user picks one on the parties screen
		await persistentStorage.delete(StoreKey.PartyId)
	},

	logOut: async () => {
		await http.post('/auth/logout')
	},
}
