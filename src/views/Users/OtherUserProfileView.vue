<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import UiView from '../../components/ui/UiView.vue'
import UiTimestamp from '../../components/ui/UiTimestamp.vue'
import { gameStateLabel } from '../../api-facade/models/games-models'
import {
	type FreePointChangeSource,
	freePointChangeSourceLabel,
	type TerritoryChangeSource,
	territoryChangeSourceLabel,
} from '../../api-facade/models/points-models'
import { formatInstant } from '../../utils/temporal'
import { useFeatureUserStore } from '../../stores/feature/featureUserStore'
import { RouteName } from '../../router/routeNames'
import PointsHistoryTabs from '../Profile/components/PointsHistoryTabs.vue'

const route = useRoute()
const userStore = useFeatureUserStore()

const login = computed(() => route.params.login as string)
const displayName = computed(() => {
	const user = userStore.users?.find((u) => u.login === login.value)
	return user?.displayName ?? login.value
})

type Tab = 'effects' | 'games' | 'points'
const activeTab = ref<Tab>('effects')

const comingSoonTabs = ['перки', 'характеристики', 'предметы', 'квесты']

const currentGame = computed(
	() => userStore.userCurrentGame[login.value] ?? null,
)
const pointsInfo = computed(() => userStore.userPoints[login.value] ?? null)
const territoryPoints = computed(
	() => userStore.userTerritoryPoints[login.value] ?? null,
)
const gamesHistory = computed(() => userStore.userHistory[login.value] ?? [])
const effectsHistory = computed(() => userStore.userEffects[login.value] ?? [])
const freeHistory = computed(
	() => userStore.userFreePointsHistory[login.value] ?? [],
)
const territoryHistory = computed(
	() => userStore.userTerritoryPointsHistory[login.value] ?? [],
)

const territoryLabelFor = (source: string) =>
	territoryChangeSourceLabel[source as TerritoryChangeSource]
const freeLabelFor = (source: string) =>
	freePointChangeSourceLabel[source as FreePointChangeSource]

const loadAll = () => {
	userStore.getUserCurrentGame(login.value)
	userStore.getUserPoints(login.value)
	userStore.getUserTerritoryPoints(login.value)
	userStore.getUserHistory(login.value)
	userStore.getUserEffects(login.value)
	userStore.getUserFreePointsHistory(login.value)
	userStore.getUserTerritoryPointsHistory(login.value)
}

onMounted(loadAll)
watch(login, loadAll)
</script>

<template>
	<UiView>
		<div class="other-profile">
			<RouterLink :to="{ name: RouteName.Users }" class="back-link"
				>← Игроки</RouterLink
			>

			<div class="profile-header">
				<div class="avatar"></div>
				<h1 class="profile-name">{{ login }} — {{ displayName }}</h1>
			</div>

			<div class="current-game" v-if="userStore.getUserCurrentGameState.isLoaded">
				<p v-if="!currentGame" class="empty-message">Игра не выбрана</p>
				<div v-else class="current-game-card">
					<span class="current-game-label">текущая игра</span>
					<span class="current-game-value">
						<span class="current-game-name">{{ currentGame.name }}</span>
						<span class="game-status-badge">{{
							gameStateLabel[currentGame.state]
						}}</span>
						<span class="item-meta">{{ formatInstant(currentGame.startDate) }}</span>
					</span>
				</div>
			</div>

			<div
				class="metrics-row"
				v-if="
					userStore.getUserPointsState.isLoaded &&
					userStore.getUserTerritoryPointsState.isLoaded
				"
			>
				<div class="metric-card">
					<span class="metric-label">Очки территорий</span>
					<div class="metric-value">{{ territoryPoints }}</div>
				</div>
				<div class="metric-card">
					<span class="metric-label">Свободные очки</span>
					<div class="metric-value">{{ pointsInfo?.freePoints }}</div>
				</div>
			</div>

			<div class="tabs">
				<button
					class="tab-button"
					:class="{ 'tab-button--active': activeTab === 'effects' }"
					@click="activeTab = 'effects'"
				>
					эффекты
				</button>
				<button
					class="tab-button"
					:class="{ 'tab-button--active': activeTab === 'games' }"
					@click="activeTab = 'games'"
				>
					игры
				</button>
				<button
					class="tab-button"
					:class="{ 'tab-button--active': activeTab === 'points' }"
					@click="activeTab = 'points'"
				>
					очки
				</button>
				<span
					v-for="label in comingSoonTabs"
					:key="label"
					class="tab-pill tab-pill--disabled"
					>{{ label }} · скоро</span
				>
			</div>

			<div v-if="activeTab === 'effects'" class="tab-content">
				<p v-if="userStore.getUserEffectsState.isLoading">Загрузка...</p>
				<p v-else-if="userStore.getUserEffectsState.isError">Ошибка загрузки</p>
				<template v-else-if="userStore.getUserEffectsState.isLoaded">
					<p v-if="!effectsHistory.length" class="empty-message">
						Нет истории эффектов
					</p>
					<ul v-else class="item-list">
						<li
							v-for="(effect, i) in effectsHistory"
							:key="i"
							class="info-card info-card--row"
						>
							<span class="item-title">{{ effect.name }}</span>
							<span class="item-meta">{{ formatInstant(effect.rollDate) }}</span>
						</li>
					</ul>
				</template>
			</div>

			<div v-if="activeTab === 'games'" class="tab-content">
				<p v-if="userStore.getUserHistoryState.isLoading">Загрузка...</p>
				<p v-else-if="userStore.getUserHistoryState.isError">Ошибка загрузки</p>
				<template v-else-if="userStore.getUserHistoryState.isLoaded">
					<p v-if="!gamesHistory.length" class="empty-message">Нет истории игр</p>
					<ul v-else class="item-list">
						<li v-for="(game, i) in gamesHistory" :key="i" class="info-card">
							<div class="info-card__row">
								<span class="item-meta">Игра</span>
								<span class="item-title">{{ game.name }}</span>
							</div>
							<div class="info-card__row">
								<span class="item-meta">Статус</span>
								<span class="item-meta">{{ gameStateLabel[game.state] }}</span>
							</div>
							<div class="info-card__row">
								<span class="item-meta">Время</span>
								<span class="item-meta"
									><UiTimestamp :time="game.timeSpent"
								/></span>
							</div>
							<div class="info-card__row">
								<span class="item-meta">Начало</span>
								<span class="item-meta">{{ formatInstant(game.startDate) }}</span>
							</div>
							<div class="info-card__row">
								<span class="item-meta">Конец</span>
								<span class="item-meta">{{
									game.finishDate ? formatInstant(game.finishDate) : '—'
								}}</span>
							</div>
						</li>
					</ul>
				</template>
			</div>

			<div v-if="activeTab === 'points'" class="tab-content points-tab">
				<PointsHistoryTabs
					:territory-entries="territoryHistory"
					:territory-label-for="territoryLabelFor"
					:free-entries="freeHistory"
					:free-label-for="freeLabelFor"
				/>
			</div>
		</div>
	</UiView>
</template>

<style scoped>
.other-profile {
	display: flex;
	flex-direction: column;
	gap: 20px;
	width: 100%;
}

.back-link {
	color: #3b82f6;
	text-decoration: none;
	font-size: 0.875rem;
	align-self: flex-start;
}

.back-link:hover {
	text-decoration: underline;
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

.metrics-row {
	display: flex;
	gap: 10px;
}

.metric-card {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 14px;
	border: 1px solid #e2e8f0;
	border-radius: 4px;
}

.metric-label {
	font-size: 0.75rem;
	color: #64748b;
}

.metric-value {
	font-size: 1.5rem;
	font-weight: 600;
}

.tabs {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	border-bottom: 1px solid #e2e8f0;
	padding-bottom: 10px;
}

.tab-button {
	padding: 6px 14px;
	background: none;
	border: 1px solid #e2e8f0;
	border-radius: 20px;
	cursor: pointer;
	color: #64748b;
	font-size: 0.8125rem;
}

.tab-button:hover {
	color: #0f172a;
}

.tab-button--active {
	color: #0f172a;
	border-color: #0f172a;
	font-weight: 500;
}

.tab-pill {
	padding: 6px 14px;
	border: 1px solid #e2e8f0;
	border-radius: 20px;
	font-size: 0.8125rem;
}

.tab-pill--disabled {
	opacity: 0.5;
	color: #94a3b8;
}

.tab-content {
	min-height: 80px;
}

.points-tab {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.item-list {
	display: flex;
	flex-direction: column;
	gap: 6px;
	list-style: none;
	padding: 0;
}

.info-card {
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 12px 16px;
	border: 1px solid #e2e8f0;
	border-radius: 4px;
}

.info-card--row {
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
}

.info-card__row {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
}

.item-title {
	font-weight: 500;
}

.item-meta {
	font-size: 0.875rem;
	color: #64748b;
}
</style>
