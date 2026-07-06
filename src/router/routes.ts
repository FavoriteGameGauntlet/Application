import type { RouteRecordRaw } from 'vue-router'
import GamesView from '../views/Games/GamesView.vue'
import LoginView from '../views/Login/LoginView.vue'
import UserDetailView from '../views/Users/UserDetailView.vue'
import UsersView from '../views/Users/UsersView.vue'
import PointsView from '../views/Points/PointsView.vue'
import MapView from '../views/Map/MapView.vue'
import CharacteristicsView from '../views/Characteristics/CharacteristicsView.vue'
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
				path: 'users',
				component: UsersView,
				name: RouteName.Users,
			},

			{
				path: 'users/:login',
				component: UserDetailView,
				name: RouteName.UserDetail,
			},

			{
				path: 'points',
				component: PointsView,
				name: RouteName.Points,
			},

			{
				path: 'map',
				component: MapView,
				name: RouteName.Map,
			},

			{
				path: 'characteristics',
				component: CharacteristicsView,
				name: RouteName.Characteristics,
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
