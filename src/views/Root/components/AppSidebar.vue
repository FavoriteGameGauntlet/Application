<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLogo from '../../../components/AppLogo.vue'
import UiIcon from '../../../components/ui/UiIcon.vue'
import { RouteName } from '../../../router/routeNames'
import { useManualStore } from '../../../stores/manualStore'
import { useSessionStore } from '../../../stores/sessionStore'
import { useSidebarStore } from '../../../stores/sidebarStore'

type NavItem = {
	label: string
	icon: string
	name: RouteName
	alsoActiveOn?: RouteName[]
}

const route = useRoute()
const manualStore = useManualStore()
const sessionStore = useSessionStore()
const sidebarStore = useSidebarStore()

/** without the label next to it, the icon needs one on hover */
const hint = (label: string) => (sidebarStore.isCollapsed ? label : undefined)

const items: NavItem[] = [
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
	{ label: 'Каталог', icon: 'book-open', name: RouteName.Catalog },
]

const adminCatalogs: NavItem[] = [
	{ label: 'Обмены', icon: 'arrow-left-right', name: RouteName.AdminExchanges },
	{ label: 'Колесо', icon: 'refresh-cw', name: RouteName.AdminWheel },
	{ label: 'Награды', icon: 'gift', name: RouteName.AdminRewards },
]

const adminSystem: NavItem[] = [
	{ label: 'Участники и права', icon: 'users', name: RouteName.AdminMembers },
	{ label: 'Системные параметры', icon: 'sliders-horizontal', name: RouteName.AdminParameters },
]

const isFreeManual = computed(
	() => route.name === RouteName.Manual && manualStore.draft?.kind === 'free',
)

/** the free manual change form is opened from the admin panel and keeps its sidebar */
const isAdminArea = computed(
	() => route.matched.some((r) => r.meta.admin) || isFreeManual.value,
)

/** the manual change form belongs to the screen it was opened from */
const manualParent = computed(() =>
	manualStore.draft?.kind === 'fix' ? RouteName.Resources : RouteName.Wheel,
)

const isActive = (item: NavItem) =>
	route.name === item.name ||
	!!item.alsoActiveOn?.includes(route.name as RouteName) ||
	(route.name === RouteName.Manual && item.name === manualParent.value)
</script>

<template>
	<nav class="sidebar" :class="{ 'sidebar--collapsed': sidebarStore.isCollapsed }">
		<AppLogo class="sidebar__logo" :height="32" :symbol="sidebarStore.isCollapsed" />

		<template v-if="isAdminArea">
			<RouterLink class="back" :to="{ name: RouteName.Home }" :title="hint('К пати')">
				<UiIcon name="arrow-left" :size="16" />
				<span class="label">К пати</span>
			</RouterLink>

			<span class="group">Каталоги</span>

			<RouterLink
				v-for="item in adminCatalogs"
				:key="item.name"
				class="nav-item"
				:class="{ 'nav-item--active': isActive(item) }"
				:to="{ name: item.name }"
				:title="hint(item.label)"
			>
				<UiIcon :name="item.icon" :size="18" />
				<span class="label">{{ item.label }}</span>
			</RouterLink>

			<span class="divider"></span>

			<RouterLink
				v-for="item in adminSystem"
				:key="item.name"
				class="nav-item"
				:class="{ 'nav-item--active': isActive(item) }"
				:to="{ name: item.name }"
				:title="hint(item.label)"
			>
				<UiIcon :name="item.icon" :size="18" />
				<span class="label">{{ item.label }}</span>
			</RouterLink>

			<span class="divider"></span>

			<button
				class="nav-item"
				:class="{ 'nav-item--active': isFreeManual }"
				type="button"
				:title="hint('Ручное изменение')"
				@click="manualStore.startFree()"
			>
				<UiIcon name="pencil" :size="18" />
				<span class="label">Ручное изменение</span>
			</button>
		</template>

		<template v-else>
			<RouterLink
				v-for="item in items"
				:key="item.name"
				class="nav-item"
				:class="{ 'nav-item--active': isActive(item) }"
				:to="{ name: item.name }"
				:title="hint(item.label)"
			>
				<UiIcon :name="item.icon" :size="18" />
				<span class="label">{{ item.label }}</span>
			</RouterLink>

			<template v-if="sessionStore.isAdmin">
				<span class="divider"></span>

				<RouterLink
					class="nav-item"
					:to="{ name: RouteName.AdminExchanges }"
					:title="hint('Панель админа')"
				>
					<UiIcon name="shield" :size="18" />
					<span class="label">Панель админа</span>
				</RouterLink>
			</template>
		</template>

		<button
			class="nav-item nav-item--bottom"
			type="button"
			:title="hint('Развернуть меню')"
			@click="sidebarStore.toggle()"
		>
			<UiIcon name="panel-left" :size="18" />
			<span class="label">Свернуть меню</span>
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

.sidebar--collapsed {
	width: 72px;
}

.sidebar__logo {
	align-self: flex-start;
	margin: 0 8px 24px;
}

.sidebar--collapsed .sidebar__logo {
	align-self: center;
	margin-inline: 0;
}

.sidebar--collapsed .label,
.sidebar--collapsed .group {
	display: none;
}

.sidebar--collapsed .nav-item,
.sidebar--collapsed .back {
	justify-content: center;
	padding: 0;
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

.nav-item--bottom {
	margin-top: auto;
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

.back {
	display: flex;
	flex: none;
	align-items: center;
	gap: 8px;
	height: 36px;
	padding: 0 12px;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	text-decoration: none;
	color: var(--text-muted);
	border-radius: var(--radius-sm);
	cursor: pointer;
}

.back:hover {
	color: var(--text-strong);
	background: var(--surface-sunken);
}

.group {
	padding: 16px 12px 6px;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-subtle);
}

.divider {
	flex: none;
	height: 1px;
	margin: 12px 0;
	background: var(--border-subtle);
}
</style>
