import { useFeatureGameStore } from './feature/featureGameStore'
import { useFeatureSystemParametersStore } from './feature/featureSystemParametersStore'
import { useFeatureTimerStore } from './feature/featureTimerStore'
import { useFeatureUserStore } from './feature/featureUserStore'
import { useFeatureWheelStore } from './feature/featureWheelStore'

export const initStores = () => {
	useFeatureSystemParametersStore().init()
	useFeatureWheelStore().init()
	useFeatureGameStore().init()
	useFeatureTimerStore().init()
	useFeatureUserStore().init()
}
