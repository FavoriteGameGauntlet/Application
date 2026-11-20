import { RouteName } from '../../router/routeNames'
import { router } from '../../router/router'
import { useAuthStore } from '../../stores/authStore'
import type { HttpErrorResponse } from '../http'
import { isSessionExpired } from '../sessionExpired'

export const unauthorizedInterceptor = async (response: HttpErrorResponse) => {
	if (isSessionExpired(response)) {
		const authStore = useAuthStore()
		authStore.login = undefined
		router.push({ name: RouteName.Login })
	}
}
