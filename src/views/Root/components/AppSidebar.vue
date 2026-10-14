<script setup lang="ts">
import { useRoute } from 'vue-router'
import AppLogo from '../../../components/AppLogo.vue'
import UiIcon from '../../../components/ui/UiIcon.vue'
import { RouteName } from '../../../router/routeNames'
import { useToastStore } from '../../../stores/toastStore'

const route = useRoute()
const toastStore = useToastStore()

const items = [
	{ label: 'Главная', icon: 'house', name: RouteName.Home },
	{ label: 'Игры', icon: 'gamepad-2', name: RouteName.Games },
	{ label: 'Колесо', icon: 'refresh-cw', name: RouteName.Wheel },
	{
		label: 'Участники',
		icon: 'users',
		name: RouteName.Users,
		alsoActiveOn: [RouteName.UserDetail],
	},
	{ label: 'Ресурсы', icon: 'coins', name: RouteName.Resources },
	{ label: 'Обмены', icon: 'arrow-left-right', name: RouteName.Exchanges },
]

const isActive = (item: (typeof items)[number]) =>
	route.name === item.name || !!item.alsoActiveOn?.includes(route.name as RouteName)

const onAdminClick = () =>
	toastStore.show('Пока не нарисовано', 'Этого экрана ещё нет в макетах.', 'info')
</script>

<template>
	<nav class="sidebar">
		<AppLogo class="sidebar__logo" :height="32" />

		<RouterLink
			v-for="item in items"
			:key="item.name"
			class="nav-item"
			:class="{ 'nav-item--active': isActive(item) }"
			:to="{ name: item.name }"
		>
			<UiIcon :name="item.icon" :size="18" />
			{{ item.label }}
		</RouterLink>

		<button class="nav-item nav-item--bottom" @click="onAdminClick">
			<UiIcon name="shield" :size="18" />
			Панель админа
		</button>
	</nav>
</template>

<style scoped>
.sidebar {
	display: flex;
	flex-direction: column;
	gap: 4px;
	flex: none;
	width: var(--sidebar-w);
	padding: 20px 16px 16px;
	background: var(--surface-card);
	border-right: 1px solid var(--border-subtle);
}

.sidebar__logo {
	align-self: flex-start;
	margin: 0 8px 24px;
}

.nav-item {
	position: relative;
	display: flex;
	flex: none;
	align-items: center;
	gap: 12px;
	height: 40px;
	padding: 0 12px;
	font: 700 13px / 1 var(--font-display);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	text-decoration: none;
	color: var(--text-muted);
	border-radius: var(--radius-sm);
	cursor: pointer;
	transition: background var(--dur-fast) var(--ease-out);
}

.nav-item:hover,
.nav-item--active {
	color: var(--text-strong);
	background: var(--surface-sunken);
}

.nav-item--active::before {
	content: '';
	position: absolute;
	left: 0;
	top: 10px;
	bottom: 10px;
	width: 3px;
	border-radius: 2px;
	background: var(--accent);
}

.nav-item--bottom {
	margin-top: auto;
}
</style>
