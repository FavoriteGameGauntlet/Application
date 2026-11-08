import { useScaleStore } from './scaleStore'
import { useThemeStore } from './themeStore'
import { useTimerStore } from './timerStore'

export const initStores = () => {
	useTimerStore().init()
	useThemeStore().init()
	useScaleStore().init()
}
