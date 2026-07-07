<script setup lang="ts">
import { RouteName } from '../../../router/routeNames'
import UserProfile from './UserProfile.vue'
import NavbarLink from './NavbarLink.vue'
import { useFeatureWheelStore } from '../../../stores/feature/featureWheelStore.ts'
import { useFeatureTimerStore } from '../../../stores/feature/featureTimerStore.ts'

const wheelStore = useFeatureWheelStore()
const timerStore = useFeatureTimerStore()
</script>

<template>
	<div class="navbar">
		<UserProfile />

		<div class="navbar__links">
			<NavbarLink :to="RouteName.Timer" :disabled="timerStore.timerUnavailable">
				Таймер
			</NavbarLink>

			<NavbarLink :to="RouteName.Effects">
				Роллы {{ wheelStore.pendingRoll ? '🔵' : '' }}
			</NavbarLink>

			<NavbarLink :to="RouteName.Points"> Очки </NavbarLink>

			<NavbarLink :to="RouteName.Map"> Карта </NavbarLink>

			<NavbarLink :to="RouteName.Characteristics"> Характеристики </NavbarLink>

			<NavbarLink :to="RouteName.Games"> Игры </NavbarLink>

			<NavbarLink :to="RouteName.Users"> Игроки </NavbarLink>
		</div>
	</div>
</template>

<style scoped>
.navbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-left: 1.75rem;
	padding-right: 1.75rem;
}

.navbar__links {
	display: flex;
	gap: 1.25rem;
}
</style>
