<script setup lang="ts">
import { RouteName } from '../../../router/routeNames'
import NavbarLink from './NavbarLink.vue'
import { useAuthStore } from '../../../stores/authStore'
import { useFeatureTimerStore } from '../../../stores/feature/featureTimerStore.ts'

const authStore = useAuthStore()
const timerStore = useFeatureTimerStore()

const comingSoon = ['Перки', 'Характеристики', 'Предметы', 'Квесты', 'Карта']

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

		<button class="logout-button" @click="onLogOutButtonClick">Выйти</button>
	</div>
</template>

<style scoped>
.sidebar {
	width: 150px;
	flex: none;
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 20px 14px;
	border-right: 1px solid #e2e8f0;
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
	border-top: 1px solid #e2e8f0;
	font-size: 0.625rem;
	letter-spacing: 0.08em;
	color: #94a3b8;
}

.spacer {
	flex: 1;
}

.logout-button {
	background: none;
	border: none;
	padding: 6px 10px;
	font-size: 0.8125rem;
	color: #64748b;
	cursor: pointer;
	text-align: left;
}

.logout-button:hover {
	text-decoration: underline;
}
</style>
