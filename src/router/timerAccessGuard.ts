import { type NavigationGuard } from 'vue-router'
import { useApiTimerStore } from '../stores/api/apiTimerStore'
import { useFeatureTimerStore } from '../stores/feature/featureTimerStore'
import { LoadingStatus } from '../utils/loadingState'
import { RouteName } from './routeNames'

export const timerAccessGuard: NavigationGuard = async (to) => {
	if (to.name !== RouteName.Timer) return true

	const timerStore = useApiTimerStore()
	await timerStore.getCurrentState.on([
		LoadingStatus.LOADED,
		LoadingStatus.ERROR,
	])

	return !useFeatureTimerStore().timerUnavailable || { name: RouteName.Games }
}
