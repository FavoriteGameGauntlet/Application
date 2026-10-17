import { defineStore } from 'pinia'
import { computed, watchEffect } from 'vue'
import { usePersistentRef } from '../composables/usePersistentRef'
import { StoreName } from '../enums/storeName'
import { StoreKey } from '../services/persistentStorage'

export const SCALES = [90, 100, 110, 125]

const DEFAULT_SCALE = 100

export const useScaleStore = defineStore(StoreName.Scale, () => {
	const { state: stored } = usePersistentRef(StoreKey.Scale)

	/** in percent; anything that is not on the list falls back to 100 */
	const scale = computed(() =>
		stored.value !== undefined && SCALES.includes(stored.value) ? stored.value : DEFAULT_SCALE,
	)

	const set = (value: number) => {
		stored.value = value
	}

	const init = () => {
		watchEffect(() => {
			document.documentElement.style.zoom = String(scale.value / 100)
		})
	}

	return { scale, set, init }
})
