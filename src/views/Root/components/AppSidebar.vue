<script setup lang="ts">
import { computed } from 'vue'
import { RouteName } from '../../../router/routeNames'
import NavbarLink from './NavbarLink.vue'
import { useAuthStore } from '../../../stores/authStore'
import { useFeatureTimerStore } from '../../../stores/feature/featureTimerStore.ts'
import { Theme, useThemeStore } from '../../../stores/themeStore'

const authStore = useAuthStore()
const timerStore = useFeatureTimerStore()
const themeStore = useThemeStore()

const comingSoon = ['Перки', 'Характеристики', 'Предметы', 'Квесты', 'Карта']

const isDarkTheme = computed(() => themeStore.theme === Theme.Dark)

const onLogOutButtonClick = () => {
	authStore.logOut()
}
</script>

<template>
	<div class="sidebar">
		<div class="wordmark">FGG3</div>

		<NavbarLink :to="RouteName.Timer" :disabled="timerStore.timerUnavailable">
			⏱ Таймер
		</NavbarLink>

		<NavbarLink :to="RouteName.Wheel"> 🎡 Колесо </NavbarLink>

		<NavbarLink :to="RouteName.Profile"> 👤 Профиль </NavbarLink>

		<NavbarLink :to="RouteName.Users"> 👥 Игроки </NavbarLink>

		<NavbarLink :to="RouteName.Games"> 🎮 Игры </NavbarLink>

		<div class="coming-soon-divider">СКОРО</div>
		<NavbarLink v-for="item in comingSoon" :key="item">
			{{ item }}
		</NavbarLink>

		<div class="spacer"></div>

		<button
			class="theme-toggle"
			type="button"
			role="switch"
			:aria-checked="isDarkTheme"
			@click="themeStore.toggle()"
		>
			<span>{{ isDarkTheme ? '🌙' : '☀️' }} Тёмная тема</span>
			<span class="theme-toggle__track" :class="{ 'theme-toggle__track--on': isDarkTheme }">
				<span class="theme-toggle__thumb"></span>
			</span>
		</button>

		<button class="logout-button" @click="onLogOutButtonClick">Выйти</button>
	</div>
</template>

<style scoped>
.sidebar {
	width: 200px;
	flex: none;
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 20px 14px;
	border-right: 1px solid var(--color-border);
}

.wordmark {
	font-size: 1.25rem;
	font-weight: 800;
	text-align: center;
	padding-bottom: 16px;
}

.coming-soon-divider {
	margin-top: 10px;
	padding-top: 10px;
	border-top: 1px solid var(--color-border);
	font-size: 0.625rem;
	letter-spacing: 0.08em;
	color: var(--color-faint);
}

.spacer {
	flex: 1;
}

.logout-button {
	background: none;
	border: none;
	padding: 6px 10px;
	font-size: 0.8125rem;
	color: var(--color-muted);
	cursor: pointer;
	text-align: left;
}

.logout-button:hover {
	text-decoration: underline;
}

.theme-toggle {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	background: none;
	border: none;
	padding: 6px 10px;
	font-size: 0.8125rem;
	color: var(--color-muted);
	cursor: pointer;
	text-align: left;
}

.theme-toggle__track {
	flex-shrink: 0;
	width: 28px;
	height: 16px;
	border-radius: 999px;
	background-color: var(--color-border);
	transition: background-color 0.15s ease;
}

.theme-toggle__track--on {
	background-color: var(--color-accent);
}

.theme-toggle__thumb {
	display: block;
	width: 12px;
	height: 12px;
	margin: 2px;
	border-radius: 50%;
	background-color: var(--color-surface);
	transition: transform 0.15s ease;
}

.theme-toggle__track--on .theme-toggle__thumb {
	transform: translateX(12px);
}
</style>
