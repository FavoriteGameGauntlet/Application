<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import UiView from '../../components/ui/UiView.vue'
import {
	type FreePointChangeSource,
	freePointChangeSourceLabel,
	type TerritoryChangeSource,
	territoryChangeSourceLabel,
} from '../../api-facade/models/points-models'
import { useAuthStore } from '../../stores/authStore'
import { useFeatureUserStore } from '../../stores/feature/featureUserStore'
import { useFeatureGameStore } from '../../stores/feature/featureGameStore'
import PointsChangeForm from './components/PointsChangeForm.vue'
import { usePointsChangeConfigs } from './components/pointsChangeConfigs'
import DisplayNameForm from './components/DisplayNameForm.vue'
import PointsHistoryTabs from './components/PointsHistoryTabs.vue'

const authStore = useAuthStore()
const userStore = useFeatureUserStore()
const gameStore = useFeatureGameStore()
const pointsChangeConfigs = usePointsChangeConfigs()

gameStore.watchCurrentGame()

const login = computed(() => authStore.login)
const displayName = computed(() => userStore.currentUser.displayName)

const pointsInfo = computed(() =>
	login.value ? (userStore.userPoints[login.value] ?? null) : null,
)
const territoryPoints = computed(() =>
	login.value ? (userStore.userPoints[login.value]?.territoryPoints ?? null) : null,
)
const experiencePoints = computed(() => userStore.userExperiencePoints)
const territoryHours = computed(() => userStore.userTerritoryHours)

const freeHistory = computed(() =>
	login.value ? (userStore.userFreePointsHistory[login.value] ?? []) : [],
)
const territoryHistory = computed(() =>
	login.value ? (userStore.userTerritoryPointsHistory[login.value] ?? []) : [],
)

const isLoading = computed(
	() =>
		userStore.getUserPointsState.isLoading ||
		userStore.getUserExperiencePointsState.isLoading ||
		userStore.getUserTerritoryHoursState.isLoading,
)
const isError = computed(
	() =>
		userStore.getUserPointsState.isError ||
		userStore.getUserExperiencePointsState.isError ||
		userStore.getUserTerritoryHoursState.isError,
)
const isLoaded = computed(
	() =>
		userStore.getUserPointsState.isLoaded &&
		userStore.getUserExperiencePointsState.isLoaded &&
		userStore.getUserTerritoryHoursState.isLoaded,
)

const territoryLabelFor = (source: string) =>
	territoryChangeSourceLabel[source as TerritoryChangeSource]
const freeLabelFor = (source: string) =>
	freePointChangeSourceLabel[source as FreePointChangeSource]

const loadAll = () => {
	if (!login.value) return

	userStore.getDisplayName()
	userStore.getUserPoints(login.value)
	userStore.getUserExperiencePoints()
	userStore.getUserTerritoryHours()
	userStore.getUserFreePointsHistory(login.value)
	userStore.getUserTerritoryPointsHistory(login.value)
}

onMounted(loadAll)
watch(login, loadAll)
</script>

<template>
	<UiView>
		<div class="profile">
			<div class="profile-header">
				<div class="avatar"></div>
				<div>
					<h1 class="profile-name">
						{{ login }} — {{ displayName }}
						<DisplayNameForm />
					</h1>
					<div class="profile-label">мой профиль</div>
				</div>
			</div>

			<div class="current-game" v-if="gameStore.getCurrentState.isLoaded">
				<p v-if="!gameStore.current" class="empty-message">Игра не выбрана</p>
				<div v-else class="current-game-card">
					<span class="current-game-label">текущая игра</span>
					<span class="current-game-value">
						<span class="current-game-name">{{ gameStore.current.name }}</span>
					</span>
				</div>
			</div>

			<p v-if="isLoading">Загрузка...</p>
			<p v-else-if="isError">Ошибка загрузки</p>
			<template v-else-if="isLoaded">
				<div class="metrics-grid">
					<div class="metric-card">
						<div class="metric-card__header">
							<span class="metric-label">Очки территорий</span>
							<PointsChangeForm :config="pointsChangeConfigs.territoryPoints" />
						</div>
						<div class="metric-value">{{ territoryPoints }}</div>
					</div>

					<div class="metric-card">
						<div class="metric-card__header">
							<span class="metric-label">Свободные очки</span>
							<PointsChangeForm :config="pointsChangeConfigs.freePoints" />
						</div>
						<div class="metric-value">{{ pointsInfo?.freePoints }}</div>
					</div>

					<div class="metric-card">
						<div class="metric-card__header">
							<span class="metric-label">Очки опыта</span>
							<PointsChangeForm :config="pointsChangeConfigs.experiencePoints" />
						</div>
						<div class="metric-value">{{ experiencePoints }}</div>
					</div>

					<div class="metric-card">
						<div class="metric-card__header">
							<span class="metric-label">Часы территорий</span>
							<PointsChangeForm :config="pointsChangeConfigs.territoryHours" />
						</div>
						<div class="metric-value">{{ territoryHours }}</div>
					</div>
				</div>

				<h2 class="history-title">История очков</h2>
				<PointsHistoryTabs
					:territory-entries="territoryHistory"
					:territory-label-for="territoryLabelFor"
					:free-entries="freeHistory"
					:free-label-for="freeLabelFor"
				/>
			</template>
		</div>
	</UiView>
</template>

<style scoped>
.profile {
	display: flex;
	flex-direction: column;
	gap: 20px;
	width: 100%;
}

.profile-header {
	display: flex;
	align-items: center;
	gap: 12px;
}

.avatar {
	width: 38px;
	height: 38px;
	border-radius: 50%;
	background-color: #e2e8f0;
	flex-shrink: 0;
}

.profile-name {
	font-size: 1.25rem;
	font-weight: 600;
}

.profile-label {
	font-size: 0.75rem;
	color: #64748b;
}

.empty-message {
	color: #64748b;
}

.current-game-card {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 14px;
	border: 1px solid #e2e8f0;
	border-radius: 10px;
}

.current-game-label {
	font-size: 0.75rem;
	color: #64748b;
}

.current-game-value {
	display: flex;
	align-items: center;
	gap: 10px;
}

.current-game-name {
	font-weight: 500;
}

.game-status-badge {
	font-size: 0.75rem;
	padding: 2px 10px;
	border: 1px solid #e2e8f0;
	border-radius: 20px;
	color: #64748b;
}

.metrics-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 10px;
}

.metric-card {
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 14px;
	border: 1px solid #e2e8f0;
	border-radius: 4px;
}

.metric-card__header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.metric-label {
	font-size: 0.75rem;
	color: #64748b;
}

.metric-value {
	font-size: 1.5rem;
	font-weight: 600;
}

.history-title {
	font-size: 0.875rem;
	color: #64748b;
	font-weight: 500;
}
</style>
