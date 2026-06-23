import { defineStore } from 'pinia'
import { computed } from 'vue'
import { api } from '../api-facade/api'
import { usePersistentRef } from '../composables/usePersistentRef'
import { StoreName } from '../enums/storeName'
import { router } from '../router/router'
import { persistentStorage, StoreKey } from '../services/persistentStorage'
import { LoadingStatus, makeLoadingState, withLoading } from '../utils/loadingState'

export const useAuthStore = defineStore(StoreName.Auth, () => {
	const { state: login, isReady: isLoginReady } = usePersistentRef(
		StoreKey.Login,
	)

	const getIsLoggedIn = async () => {
		const login = await persistentStorage.get(StoreKey.Login)
		return login !== undefined
	}

	const isLoggedIn = computed(() => login.value !== undefined)

	const loginState = makeLoadingState()

	const signUp = async (data: {
		login: string
		password: string
		email: string
	}) => {
		if (loginState.isLoading.value) return
		if (!isLoginReady)
			throw new Error('Persistent storage is not yet initialized')

		loginState.status.value = LoadingStatus.LOADING

		return api.auth
			.signUp({ body: data })
			.then(() => {
				login.value = data.login
				return api.auth.logIn({
					body: { login: data.login, password: data.password },
				})
			})
			.then(() => {
				loginState.status.value = LoadingStatus.LOADED
			})
			.catch((e) => {
				loginState.status.value = LoadingStatus.ERROR
				throw e
			})
	}

	const logIn = async (data: { login: string; password: string }) => {
		if (loginState.isLoading.value) return
		if (!isLoginReady)
			throw new Error('Persistent storage is not yet initialized')

		loginState.status.value = LoadingStatus.LOADING

		return api.auth
			.logIn({ body: data })
			.then(() => {
				login.value = data.login
				loginState.status.value = LoadingStatus.LOADED
			})
			.catch((e) => {
				loginState.status.value = LoadingStatus.ERROR
				throw e
			})
	}

	const [logOut, logOutState] = withLoading(async (status) => {
		if (status.value === LoadingStatus.LOADING) return
		if (!isLoginReady)
			throw new Error('Persistent storage is not yet initialized')

		status.value = LoadingStatus.LOADING

		return api.auth
			.logOut()
			.then(() => {
				status.value = LoadingStatus.LOADED
			})
			.catch((e) => {
				status.value = LoadingStatus.ERROR
				throw e
			})
			.finally(() => {
				login.value = undefined
				router.push('/login')
			})
	})

	return {
		login,
		getIsLoggedIn,
		isLoggedIn,

		signUp,
		logIn,
		loginState,

		logOut,
		logOutState,
	}
})
