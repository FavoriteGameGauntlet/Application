import { defineStore } from 'pinia'
import { watchEffect } from 'vue'
import { usePersistentRef } from '../composables/usePersistentRef'
import { StoreName } from '../enums/storeName'
import { StoreKey } from '../services/persistentStorage'

export enum Theme {
	Light = 'light',
	Dark = 'dark',
}

export const useThemeStore = defineStore(StoreName.Theme, () => {
	const { state: theme } = usePersistentRef(StoreKey.Theme)

	const toggle = () => {
		theme.value = theme.value === Theme.Dark ? Theme.Light : Theme.Dark
	}

	const init = () => {
		watchEffect(() => {
			document.documentElement.dataset.theme = theme.value ?? Theme.Light
		})
	}

	return { theme, toggle, init }
})
