import { invoke } from '@tauri-apps/api/core'
import type { UnlistenFn } from '@tauri-apps/api/event'
import {
	getCurrentWindow,
	LogicalSize,
	type PhysicalPosition,
	type PhysicalSize,
} from '@tauri-apps/api/window'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usePersistentRef } from '../composables/usePersistentRef'
import { StoreName } from '../enums/storeName'
import { StoreKey } from '../services/persistentStorage'
import { useScaleStore } from './scaleStore'
import { useToastStore } from './toastStore'

/** the same as minWidth and minHeight of the window in tauri.conf.json */
const NORMAL_MIN_SIZE = new LogicalSize(1100, 600)

/** at the scale of 100%; the window grows with the interface scale */
export const MINI_SIZE = new LogicalSize(200, 250)

/** the content scales with the window, but not below this */
const MINI_MIN_SIZE = new LogicalSize(MINI_SIZE.width / 2, MINI_SIZE.height / 2)

const MINI_RATIO = MINI_SIZE.width / MINI_SIZE.height

type WindowBounds = {
	size: PhysicalSize
	position: PhysicalPosition
	maximized: boolean
}

/** the window keeps it while being resized, see aspect_ratio.rs; null unlocks it */
const lockRatio = (ratio: number | null) => invoke('set_aspect_ratio', { ratio })

export const useMiniModeStore = defineStore(StoreName.MiniMode, () => {
	const isMini = ref(false)

	const { state: storedWidth } = usePersistentRef(StoreKey.MiniWidth)

	/** a double click must not save the already shrunk window as the normal one */
	let isSwitching = false

	let normalBounds: WindowBounds | undefined

	let stopSavingWidth: UnlistenFn | undefined

	const enter = async () => {
		const win = getCurrentWindow()

		normalBounds = {
			size: await win.innerSize(),
			position: await win.outerPosition(),
			maximized: await win.isMaximized(),
		}

		if (normalBounds.maximized) await win.unmaximize()

		// the frame goes before the resize, it takes a part of the window size
		await win.setDecorations(false)

		const k = useScaleStore().scale / 100
		const width = Math.max(storedWidth.value ?? MINI_SIZE.width, MINI_MIN_SIZE.width)

		// the minimal size goes first, otherwise it stops the window from shrinking
		await win.setMinSize(new LogicalSize(MINI_MIN_SIZE.width * k, MINI_MIN_SIZE.height * k))
		await win.setSize(new LogicalSize(width * k, (width / MINI_RATIO) * k))
		await win.setAlwaysOnTop(true)

		// saved on the go, so the size is not lost if the app is closed in the mini mode
		const factor = (await win.scaleFactor()) * k
		stopSavingWidth = await win.onResized(({ payload }) => {
			storedWidth.value = Math.round(payload.width / factor)
		})

		await lockRatio(MINI_RATIO)

		isMini.value = true
	}

	const leave = async () => {
		if (!normalBounds) return

		const win = getCurrentWindow()

		// before the resize back, or the big window would be saved as the mini one
		stopSavingWidth?.()
		stopSavingWidth = undefined

		await lockRatio(null)

		await win.setAlwaysOnTop(false)
		await win.setDecorations(true)
		await win.setMinSize(NORMAL_MIN_SIZE)
		await win.setSize(normalBounds.size)
		await win.setPosition(normalBounds.position)

		if (normalBounds.maximized) await win.maximize()

		isMini.value = false
	}

	const toggle = async () => {
		if (isSwitching) return

		isSwitching = true

		try {
			await (isMini.value ? leave() : enter())
		} catch (e) {
			useToastStore().error(e)
		} finally {
			isSwitching = false
		}
	}

	return { isMini, toggle }
})
