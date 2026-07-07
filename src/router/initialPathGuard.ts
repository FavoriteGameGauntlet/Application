import { type NavigationGuard } from 'vue-router'
import { persistentStorage, StoreKey } from '../services/persistentStorage'

let initialized = false

/** on load, redirects to the last opened route */
export const initialPathGuard: NavigationGuard = async (to) => {
	if (initialized) {
		await persistentStorage.set(StoreKey.InitialRoute, to.path)
		return true
	}

	initialized = true
	const initialPath = await persistentStorage.get(StoreKey.InitialRoute)
	await persistentStorage.set(StoreKey.InitialRoute, to.path)

	return initialPath ?? true
}
