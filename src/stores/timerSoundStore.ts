import { defineStore } from 'pinia'
import { computed } from 'vue'
import defaultSound from '../assets/sounds/timer-end.mp3'
import { usePersistentRef } from '../composables/usePersistentRef'
import { StoreName } from '../enums/storeName'
import { StoreKey } from '../services/persistentStorage'

/** the sound of the end of the timer; the choice lives on this computer, like the theme */
export const useTimerSoundStore = defineStore(StoreName.TimerSound, () => {
	const { state: stored } = usePersistentRef(StoreKey.TimerSound)

	const enabled = computed(() => stored.value !== false)

	const setEnabled = (value: boolean) => {
		stored.value = value
	}

	const play = () => {
		if (!enabled.value) return

		// a window that never had a click may refuse to play; the end of the timer is not worth an error
		new Audio(defaultSound).play().catch(() => {})
	}

	return { enabled, setEnabled, play }
})
