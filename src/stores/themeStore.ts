import { defineStore } from 'pinia'
import { computed, watchEffect } from 'vue'
import { usePersistentRef } from '../composables/usePersistentRef'
import { StoreName } from '../enums/storeName'
import { StoreKey } from '../services/persistentStorage'

export enum Theme {
	Light = 'light',
	Dark = 'dark',
}

export const useThemeStore = defineStore(StoreName.Theme, () => {
	const { state: theme } = usePersistentRef(StoreKey.Theme)

	const isDark = computed(() => theme.value !== Theme.Light)

	const toggle = () => {
		theme.value = isDark.value ? Theme.Light : Theme.Dark
	}

	const init = () => {
		watchEffect(() => {
			document.documentElement.dataset.theme = theme.value ?? Theme.Dark
		})
	}

	return { theme, isDark, toggle, init }
})
