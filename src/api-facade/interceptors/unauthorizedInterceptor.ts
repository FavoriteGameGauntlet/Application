import { fetch } from '@tauri-apps/plugin-http'
import { API_URL } from '../../constants/apiUrl'
import { RouteName } from '../../router/routeNames'
import { router } from '../../router/router'
import { credentialsStorage } from '../../services/credentialsStorage'
import { useAuthStore } from '../../stores/authStore'
import type { HttpErrorResponse } from '../http'

const SESSION_EXPIRED_CODES = ['COOKIE_NOT_FOUND', 'NO_ACTIVE_SESSION']

const tryAutoRelogin = async (): Promise<boolean> => {
	try {
		const credentials = await credentialsStorage.get()
		if (!credentials) return false

		const response = await fetch(API_URL + '/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ login: credentials.username, password: credentials.password }),
		})
		return response.ok
	} catch {
		return false
	}
}

export const unauthorizedInterceptor = async (
	response: HttpErrorResponse,
	retry: () => Promise<unknown>,
) => {
	if (
		response.status === 401 &&
		SESSION_EXPIRED_CODES.includes(response.body?.code ?? '')
	) {
		if (await tryAutoRelogin()) {
			await retry()
			return
		}

		const authStore = useAuthStore()
		authStore.login = undefined
		router.push({ name: RouteName.Login })
	}
}
