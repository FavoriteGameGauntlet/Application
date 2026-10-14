<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useClickOutside } from '../../../composables/useClickOutside'
import UiBadge from '../../../components/ui/UiBadge.vue'
import UiIcon from '../../../components/ui/UiIcon.vue'
import UiIconButton from '../../../components/ui/UiIconButton.vue'
import UiPlayerAvatar from '../../../components/ui/UiPlayerAvatar.vue'
import { useAuthStore } from '../../../stores/authStore'
import { useMembersStore } from '../../../stores/membersStore'
import { useSessionStore } from '../../../stores/sessionStore'
import { useThemeStore } from '../../../stores/themeStore'

const authStore = useAuthStore()
const membersStore = useMembersStore()
const sessionStore = useSessionStore()
const themeStore = useThemeStore()

const menuOpen = ref(false)
const userMenu = useTemplateRef('userMenu')

useClickOutside(userMenu, () => (menuOpen.value = false))

const onLogOut = () => {
	menuOpen.value = false
	authStore.logOut()
}
</script>

<template>
	<header class="topbar">
		<button class="season" type="button">{{ sessionStore.season?.name }}</button>

		<UiBadge v-if="sessionStore.isAdmin" tone="navy">админ</UiBadge>

		<div class="topbar__spacer"></div>

		<UiIconButton
			:icon="themeStore.isDark ? 'sun' : 'moon'"
			:label="themeStore.isDark ? 'Светлая тема' : 'Тёмная тема'"
			@click="themeStore.toggle()"
		/>

		<div ref="userMenu" class="user-menu">
			<div class="user-menu__trigger" @click="menuOpen = !menuOpen">
				<UiPlayerAvatar
					:name="sessionStore.login"
					:color="membersStore.colorOf(sessionStore.login)"
					:size="28"
				/>
				{{ sessionStore.login }}
				<UiIcon name="chevron-down" :size="16" />
			</div>

			<div v-if="menuOpen" class="user-menu__popup">
				<div class="user-menu__item" @click="onLogOut">
					<UiIcon name="log-out" :size="16" />
					Выйти
				</div>
			</div>
		</div>
	</header>
</template>

<style scoped>
.topbar {
	position: relative;
	z-index: 10;
	display: flex;
	flex: none;
	align-items: center;
	gap: 12px;
	height: var(--topbar-h);
	padding: 0 24px;
	background: var(--surface-card);
	border-bottom: 1px solid var(--border-subtle);
}

.topbar__spacer {
	flex: 1;
}

.season {
	display: flex;
	align-items: center;
	gap: 8px;
	height: 40px;
	padding: 0 10px;
	margin-left: -10px;
	font: var(--type-h4);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
	background: transparent;
	border-radius: var(--radius-sm);
	cursor: pointer;
	transition: background 120ms ease-out;
}

.season:hover {
	background: var(--surface-sunken);
}

.season:active {
	transform: translateY(1px);
}

.user-menu {
	position: relative;
}

.user-menu__trigger,
.user-menu__item {
	display: flex;
	align-items: center;
	gap: 10px;
	height: 40px;
	font: 600 14px / 1 var(--font-body);
	color: var(--text-strong);
	border-radius: var(--radius-sm);
	cursor: pointer;
}

.user-menu__trigger {
	padding: 0 10px 0 6px;
}

.user-menu__trigger:hover,
.user-menu__item:hover {
	background: var(--surface-sunken);
}

.user-menu__popup {
	position: absolute;
	top: 46px;
	right: 0;
	display: flex;
	flex-direction: column;
	width: 200px;
	padding: 4px;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-md);
	box-shadow: var(--shadow-3);
}

.user-menu__item {
	padding: 0 12px;
}
</style>
