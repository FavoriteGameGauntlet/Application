import type { RouteRecordRaw } from 'vue-router'
import AuthView from '../views/Auth/AuthView.vue'
import ExchangesView from '../views/Exchanges/ExchangesView.vue'
import GamesView from '../views/Games/GamesView.vue'
import HomeView from '../views/Home/HomeView.vue'
import ResourcesView from '../views/Resources/ResourcesView.vue'
import RootView from '../views/Root/RootView.vue'
import UserProfileView from '../views/Users/UserProfileView.vue'
import UsersView from '../views/Users/UsersView.vue'
import WheelView from '../views/Wheel/WheelView.vue'
import { RouteName } from './routeNames'

export const routes: RouteRecordRaw[] = [
	{
		path: '/',
		component: RootView,
		name: RouteName.Root,

		children: [
			{
				path: '',
				component: HomeView,
				name: RouteName.Home,
			},

			{
				path: 'games',
				component: GamesView,
				name: RouteName.Games,
			},

			{
				path: 'wheel',
				component: WheelView,
				name: RouteName.Wheel,
			},

			{
				path: 'users',
				component: UsersView,
				name: RouteName.Users,
			},

			{
				path: 'users/:login',
				component: UserProfileView,
				name: RouteName.UserDetail,
			},

			{
				path: 'resources/:tab?',
				component: ResourcesView,
				name: RouteName.Resources,
			},

			{
				path: 'exchanges',
				component: ExchangesView,
				name: RouteName.Exchanges,
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
		redirect: { name: RouteName.Home },
	},
]
