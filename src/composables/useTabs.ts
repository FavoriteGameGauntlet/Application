import { computed } from 'vue'
import { RouteName } from '../router/routeNames'
import { router } from '../router/router'

export const useTabs = () => {
	const tabTargets = [
		RouteName.Timer,
		RouteName.Effects,
		RouteName.Games,
		[RouteName.Users, RouteName.UserDetail],
		RouteName.Dev,
	] as const

	const currentTabIndex = computed((prevIndex: number | undefined) => {
		const currentRoute = router.currentRoute.value.name

		const foundIndex = tabTargets.findIndex((tabGroup) =>
			Array.isArray(tabGroup)
				? tabGroup.includes(currentRoute)
				: tabGroup === currentRoute,
		)

		return foundIndex ?? prevIndex ?? 0
	})

	const getShiftedRoute = (delta: number): RouteName => {
		const targetGroup = tabTargets.at(
			(currentTabIndex.value + delta) % tabTargets.length,
		)!

		return typeof targetGroup === 'string' ? targetGroup : targetGroup[0]
	}

	return {
		back: () => {
			router.push({ name: getShiftedRoute(-1) })
		},
		forward: () => {
			router.push({ name: getShiftedRoute(1) })
		},
	}
}
