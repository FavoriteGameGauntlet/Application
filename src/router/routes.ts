import type { RouteRecordRaw } from 'vue-router'
import GamesView from '../views/Games/GamesView.vue'
import AuthView from '../views/Auth/AuthView.vue'
import OtherUserProfileView from '../views/Users/OtherUserProfileView.vue'
import UsersView from '../views/Users/UsersView.vue'
import ProfileView from '../views/Profile/ProfileView.vue'
import RootView from '../views/Root/RootView.vue'
import TimerView from '../views/Timer/TimerView.vue'
import WheelView from '../views/Wheel/WheelView.vue'
import { useAuthStore } from '../stores/authStore'
import { RouteName } from './routeNames'

export const routes: RouteRecordRaw[] = [
	{
		path: '/',
		component: RootView,
		name: RouteName.Root,
		redirect: 'timer',

		children: [
			{
				path: 'timer',
				component: TimerView,
				name: RouteName.Timer,
			},

			{
				path: 'users',
				component: UsersView,
				name: RouteName.Users,
			},

			{
				path: 'users/:login',
				component: OtherUserProfileView,
				name: RouteName.UserDetail,
				beforeEnter: (to) => {
					const authStore = useAuthStore()

					if (to.params.login === authStore.login) {
						return { name: RouteName.Profile }
					}

					return true
				},
			},

			{
				path: 'profile',
				component: ProfileView,
				name: RouteName.Profile,
			},

			{
				path: 'games',
				component: GamesView,
				name: RouteName.Games,
			},

			{
				path: 'wheel',
				name: RouteName.Wheel,
				component: WheelView,
			},
		],
	},
	{
		path: '/login',
		component: AuthView,
		name: RouteName.Login,
	},

	{
		path: '/:pathMatch(.*)*',
		redirect: { name: RouteName.Timer },
	},
]
