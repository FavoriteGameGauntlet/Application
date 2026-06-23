import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../../api-facade/api'
import type { HttpErrorResponse } from '../../api-facade/http'
import { type Login } from '../../api-facade/models/users-models'
import { usePersistentRef } from '../../composables/usePersistentRef'
import { StoreName } from '../../enums/storeName'
import { StoreKey } from '../../services/persistentStorage'
import { LoadingStatus, withLoading } from '../../utils/loadingState'

export const useApiUserStore = defineStore(StoreName.ApiUser, () => {
	const users = ref<Login[] | null>(null)
	const { state: currentUserDisplayName } = usePersistentRef(
		StoreKey.DisplayName,
	)

	const [getAllUsers, getAllUsersState] = withLoading(async (status) => {
		if (status.value === LoadingStatus.LOADING) return

		status.value = LoadingStatus.LOADING

		await api.users
			.getAllNames()
			.then((newUsers) => {
				users.value = newUsers
				status.value = LoadingStatus.LOADED
			})
			.catch((error) => {
				status.value = LoadingStatus.ERROR

				throw error
			})
	})

	const [getDisplayName, getDisplayNameState] = withLoading(async (status) => {
		if (status.value === LoadingStatus.LOADING) return

		status.value = LoadingStatus.LOADING

		await api.users
			.getDisplayName()
			.then((name) => {
				currentUserDisplayName.value = name
				status.value = LoadingStatus.LOADED
			})
			.catch((error) => {
				if (error.status === 404) {
					currentUserDisplayName.value = undefined
					status.value = LoadingStatus.LOADED
					return
				}

				status.value = LoadingStatus.ERROR

				throw error
			})
	})

	const [setDisplayName, setDisplayNameState] = withLoading(
		async (status, newName: string) => {
			if (status.value === LoadingStatus.LOADING) return

			const oldName = currentUserDisplayName.value
			currentUserDisplayName.value = newName
			status.value = LoadingStatus.LOADING

			await api.users
				.postDisplayName({ body: { name: newName } })
				.then(() => {
					status.value = LoadingStatus.LOADED
				})
				.catch((error: HttpErrorResponse) => {
					status.value = LoadingStatus.ERROR
					currentUserDisplayName.value = oldName

					throw error
				})
		},
	)

	return {
		users,
		currentUserDisplayName,

		getAllUsers,
		getAllUsersState,

		getDisplayName,
		getDisplayNameState,

		setDisplayName,
		setDisplayNameState,
	}
})
