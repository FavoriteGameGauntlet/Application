import type { RouteRecordRaw } from 'vue-router'
import AdminCatalogView from '../views/Admin/AdminCatalogView.vue'
import AdminExchangesView from '../views/Admin/AdminExchangesView.vue'
import AdminMembersView from '../views/Admin/AdminMembersView.vue'
import AdminParametersView from '../views/Admin/AdminParametersView.vue'
import AdminRewardsView from '../views/Admin/AdminRewardsView.vue'
import AdminWheelView from '../views/Admin/AdminWheelView.vue'
import AuthView from '../views/Auth/AuthView.vue'
import CatalogView from '../views/Catalog/CatalogView.vue'
import ExchangesView from '../views/Exchanges/ExchangesView.vue'
import GamesView from '../views/Games/GamesView.vue'
import HomeView from '../views/Home/HomeView.vue'
import ManualView from '../views/Manual/ManualView.vue'
import PartiesView from '../views/Parties/PartiesView.vue'
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

			{
				path: 'catalog',
				component: CatalogView,
				name: RouteName.Catalog,
			},

			{
				path: 'manual',
				component: ManualView,
				name: RouteName.Manual,
			},

			{
				path: 'admin',
				// the admin panel has a sidebar of its own, only admins of the party get in
				meta: { admin: true },
				redirect: { name: RouteName.AdminExchanges },
				children: [
					{
						path: 'catalog',
						component: AdminCatalogView,
						name: RouteName.AdminCatalog,
					},
					{
						path: 'exchanges',
						component: AdminExchangesView,
						name: RouteName.AdminExchanges,
					},
					{
						path: 'wheel',
						component: AdminWheelView,
						name: RouteName.AdminWheel,
					},
					{
						path: 'rewards',
						component: AdminRewardsView,
						name: RouteName.AdminRewards,
					},
					{
						path: 'members',
						component: AdminMembersView,
						name: RouteName.AdminMembers,
					},
					{
						path: 'parameters',
						component: AdminParametersView,
						name: RouteName.AdminParameters,
					},
				],
			},
		],
	},

	{
		path: '/login',
		component: AuthView,
		name: RouteName.Login,
	},

	{
		path: '/parties',
		component: PartiesView,
		name: RouteName.Parties,
	},

	{
		path: '/:pathMatch(.*)*',
		redirect: { name: RouteName.Home },
	},
]
