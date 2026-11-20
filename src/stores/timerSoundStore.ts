import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import defaultSound from '../assets/sounds/timer-end.mp3'
import { usePersistentRef } from '../composables/usePersistentRef'
import { StoreName } from '../enums/storeName'
import { StoreKey } from '../services/persistentStorage'

/** the types the file window offers; the copy keeps no extension, so the stored name gives the type */
const SOUND_TYPES: Record<string, string> = {
	mp3: 'audio/mpeg',
	ogg: 'audio/ogg',
	wav: 'audio/wav',
}

const extensionOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? ''

/** the sound of the end of the timer; the choice lives on this computer, like the theme */
export const useTimerSoundStore = defineStore(StoreName.TimerSound, () => {
	const { state: storedEnabled } = usePersistentRef(StoreKey.TimerSound)
	/** the name of the user's own file; the file itself is copied by the app */
	const { state: customName } = usePersistentRef(StoreKey.TimerSoundName)

	const enabled = computed(() => storedEnabled.value !== false)

	const setEnabled = (value: boolean) => {
		storedEnabled.value = value
	}

	const { state: storedRepeat } = usePersistentRef(StoreKey.TimerSoundRepeat)

	const repeat = computed(() => storedRepeat.value !== false)

	const setRepeat = (value: boolean) => {
		storedRepeat.value = value
	}

	/** the object URL of the user's file, read once */
	let customUrl: string | undefined

	const forgetCustom = () => {
		if (customUrl) URL.revokeObjectURL(customUrl)
		customUrl = undefined
	}

	const source = async () => {
		const name = customName.value
		if (!name) return defaultSound

		if (!customUrl) {
			try {
				const bytes = await invoke<ArrayBuffer>('timer_sound_read')
				customUrl = URL.createObjectURL(
					new Blob([bytes], { type: SOUND_TYPES[extensionOf(name)] }),
				)
			} catch {
				// the copy is gone from the app folder; the end of the timer still has to sound
				return defaultSound
			}
		}

		return customUrl
	}

	const playing = shallowRef<HTMLAudioElement>()

	const stop = () => {
		playing.value?.pause()
		playing.value = undefined
	}

	const start = async (loop: boolean) => {
		stop()

		const audio = new Audio(await source())
		audio.loop = loop
		audio.addEventListener('ended', () => {
			if (playing.value === audio) playing.value = undefined
		})
		playing.value = audio

		// a window that never had a click may refuse to play; the end of the timer is not worth an error
		await audio.play().catch(stop)
	}

	/** repeats until the window gets focus; a window that has it already gets the sound once, or nothing would stop it */
	const play = () => {
		if (enabled.value) void start(repeat.value && !document.hasFocus())
	}

	/** the button in the menu: listen to the sound, or stop it */
	const preview = () => {
		if (playing.value) stop()
		else void start(false)
	}

	/** why the last chosen file was not taken; the settings show it under the button */
	const chooseError = ref<string>()

	const choose = async () => {
		const path = await open({
			filters: [{ name: 'Звук', extensions: Object.keys(SOUND_TYPES) }],
		})
		if (!path) return

		try {
			await invoke('timer_sound_save', { path })
		} catch (e) {
			chooseError.value =
				e === 'too_large'
					? 'Файл больше 5 МБ.'
					: 'Не получилось скопировать файл.'
			return
		}

		chooseError.value = undefined
		stop()
		forgetCustom()
		customName.value = path.split(/[\\/]/).pop()
	}

	const reset = async () => {
		chooseError.value = undefined
		stop()
		forgetCustom()
		customName.value = undefined
		// a copy left behind is never read once the name is gone
		await invoke('timer_sound_clear').catch(() => {})
	}

	const init = () => {
		// the sound is a call to come back; once the user is here, it has done its job
		window.addEventListener('focus', stop)
	}

	return {
		enabled,
		setEnabled,
		repeat,
		setRepeat,
		customName,
		chooseError,
		isPlaying: computed(() => !!playing.value),
		play,
		preview,
		stop,
		choose,
		reset,
		init,
	}
})
