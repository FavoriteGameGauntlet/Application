import { onScopeDispose } from 'vue'
import { api } from '../api-facade/api'

/** the backend marks a member offline after 90 seconds without a ping */
const PING_INTERVAL_MS = 30_000

/** tells the backend the app is running; stops with the scope that started it */
export const usePresence = () => {
	const ping = () => {
		// a missed ping is not an error for the user, the next one comes in 30 seconds
		api.presence.ping().catch(() => undefined)
	}

	ping()

	const timer = setInterval(ping, PING_INTERVAL_MS)

	onScopeDispose(() => clearInterval(timer))
}
