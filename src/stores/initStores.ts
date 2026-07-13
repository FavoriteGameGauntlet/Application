import { useFeatureSystemParametersStore } from './feature/featureSystemParametersStore'
import { useFeatureTimerStore } from './feature/featureTimerStore'
import { useThemeStore } from './themeStore'

export const initStores = () => {
	useFeatureSystemParametersStore().init()
	useFeatureTimerStore().init()
	useThemeStore().init()
}
