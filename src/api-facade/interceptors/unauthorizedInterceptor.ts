import { RouteName } from '../../router/routeNames'
import { router } from '../../router/router'
import { useAuthStore } from '../../stores/authStore'
import type { HttpErrorResponse } from '../http'

const SESSION_EXPIRED_CODES = ['COOKIE_NOT_FOUND', 'NO_ACTIVE_SESSION']

export const unauthorizedInterceptor = async (
	response: HttpErrorResponse,
) => {
	if (
		response.status === 401 &&
		SESSION_EXPIRED_CODES.includes(response.body?.code ?? '')
	) {
		const authStore = useAuthStore()
		authStore.login = undefined
		router.push({ name: RouteName.Login })
	}
}
