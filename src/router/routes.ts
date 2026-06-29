import type { RouteRecordRaw } from 'vue-router'
import DevView from '../views/Dev/DevView.vue'
import GamesView from '../views/Games/GamesView.vue'
import LoginView from '../views/Login/LoginView.vue'
import PlayerDetailView from '../views/Players/PlayerDetailView.vue'
import PlayersView from '../views/Players/PlayersView.vue'
import RootView from '../views/Root/RootView.vue'
import SignUpView from '../views/SignUp/SignUpView.vue'
import TimerView from '../views/Timer/TimerView.vue'
import WheelRollsView from '../views/WheelRolls/WheelRollsView.vue'
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
				path: 'players',
				component: PlayersView,
				name: RouteName.Players,
			},

			{
				path: 'players/:login',
				component: PlayerDetailView,
				name: RouteName.PlayerDetail,
			},

			{
				path: 'games',
				component: GamesView,
				name: RouteName.Games,
			},

			{
				path: 'wheel',
				name: RouteName.Effects,
				component: WheelRollsView,
			},

			{
				path: 'dev',
				component: DevView,
				name: RouteName.Dev,
			},
		],
	},
	{
		path: '/login',
		component: LoginView,
		name: RouteName.Login,
	},

	{
		path: '/signup',
		component: SignUpView,
		name: RouteName.Signup,
	},

	{
		path: '/:pathMatch(.*)*',
		redirect: { name: RouteName.Timer },
	},
]
