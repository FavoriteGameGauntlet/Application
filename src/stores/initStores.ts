import { useScaleStore } from './scaleStore'
import { useThemeStore } from './themeStore'
import { useTimerSoundStore } from './timerSoundStore'
import { useTimerStore } from './timerStore'

export const initStores = () => {
	useTimerStore().init()
	useTimerSoundStore().init()
	useThemeStore().init()
	useScaleStore().init()
}
