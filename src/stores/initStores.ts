import { useFeatureSystemParametersStore } from './feature/featureSystemParametersStore'
import { useFeatureTimerStore } from './feature/featureTimerStore'

export const initStores = () => {
	useFeatureSystemParametersStore().init()
	useFeatureTimerStore().init()
}
