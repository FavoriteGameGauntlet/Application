import { type NavigationGuard } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { RouteName } from './routeNames'

export const authGuard: NavigationGuard = async (to) => {
	const authStore = useAuthStore()
	const isLoggedIn = await authStore.getIsLoggedIn()

	if (to.name === RouteName.Login) {
		return !isLoggedIn || { name: RouteName.Timer }
	}

	return isLoggedIn || { name: RouteName.Login }
}
