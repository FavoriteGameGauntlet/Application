<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Temporal } from '@js-temporal/polyfill'
import UiView from '../../components/ui/UiView.vue'
import UiTimestamp from '../../components/ui/UiTimestamp.vue'
import { GameState } from '../../api-facade/models/games-models'
import { useAuthStore } from '../../stores/authStore'
import { useFeatureUserStore } from '../../stores/feature/featureUserStore'
import { RouteName } from '../../router/routeNames'
import { ref } from 'vue'

const route = useRoute()
const userStore = useFeatureUserStore()
const authStore = useAuthStore()

const login = computed(() => route.params.login as string)
const isCurrentUser = computed(() => login.value === authStore.login)
const displayName = computed(() => {
	const user = userStore.users?.find((u) => u.login === login.value)
	return user?.displayName ?? login.value
})

type Tab = 'game' | 'history' | 'wishlist' | 'points' | 'effects'
const activeTab = ref<Tab>('game')

const tabs: { key: Tab; label: string }[] = [
	{ key: 'game', label: 'Текущая игра' },
	{ key: 'history', label: 'История' },
	{ key: 'wishlist', label: 'Вишлист' },
	{ key: 'points', label: 'Очки' },
	{ key: 'effects', label: 'Эффекты' },
]

const currentGame = computed(() => userStore.playerCurrentGame[login.value] ?? null)
const gameHistory = computed(() => userStore.playerHistory[login.value] ?? [])
const wishlist = computed(() => userStore.playerWishlist[login.value] ?? [])
const pointsInfo = computed(() => userStore.playerPoints[login.value] ?? null)
const wheelEffects = computed(() => userStore.playerEffects[login.value] ?? [])

const loadAll = () => {
	userStore.getPlayerCurrentGame(login.value)
	userStore.getPlayerHistory(login.value)
	userStore.getPlayerWishlist(login.value)
	userStore.getPlayerPoints(login.value)
	userStore.getPlayerEffects(login.value)
}

onMounted(loadAll)
watch(login, loadAll)

const formatInstant = (instant: Temporal.Instant): string => {
	const tz = Temporal.Now.timeZoneId()
	const dt = instant.toZonedDateTimeISO(tz)
	const pad = (n: number) => n.toString().padStart(2, '0')
	return `${dt.year}-${pad(dt.month)}-${pad(dt.day)} ${pad(dt.hour)}:${pad(dt.minute)}`
}

const gameStateLabel: Record<GameState, string> = {
	[GameState.Started]: 'В процессе',
	[GameState.Finished]: 'Завершена',
	[GameState.Cancelled]: 'Брошена',
}
</script>

<template>
	<UiView>
		<div class="player-detail">
			<RouterLink :to="{ name: RouteName.Players }" class="back-link">← Игроки</RouterLink>

			<div class="player-header">
				<h1 class="player-name">{{ displayName }}</h1>
				<span v-if="isCurrentUser" class="current-badge">Вы</span>
			</div>

			<div class="tabs">
				<button
					v-for="t in tabs"
					:key="t.key"
					class="tab-button"
					:class="{ 'tab-button--active': activeTab === t.key }"
					@click="activeTab = t.key"
				>
					{{ t.label }}
				</button>
			</div>

			<div v-if="activeTab === 'game'" class="tab-content">
				<p v-if="userStore.getPlayerCurrentGameState.isLoading">Загрузка...</p>
				<p v-else-if="userStore.getPlayerCurrentGameState.isError">Ошибка загрузки</p>
				<template v-else-if="userStore.getPlayerCurrentGameState.isLoaded">
					<p v-if="!currentGame" class="empty-message">Игра не выбрана</p>
					<div v-else class="info-card">
						<span class="item-title">{{ currentGame.name }}</span>
						<span class="item-meta">{{ gameStateLabel[currentGame.state] }}</span>
						<span class="item-meta">
							Время: <UiTimestamp :time="currentGame.timeSpent" />
						</span>
					</div>
				</template>
			</div>

			<div v-if="activeTab === 'history'" class="tab-content">
				<p v-if="userStore.getPlayerHistoryState.isLoading">Загрузка...</p>
				<p v-else-if="userStore.getPlayerHistoryState.isError">Ошибка загрузки</p>
				<template v-else-if="userStore.getPlayerHistoryState.isLoaded">
					<p v-if="!gameHistory.length" class="empty-message">Нет истории игр</p>
					<ul v-else class="item-list">
						<li v-for="(game, i) in gameHistory" :key="i" class="info-card">
							<span class="item-title">{{ game.name }}</span>
							<span class="item-meta">{{ gameStateLabel[game.state] }}</span>
							<span v-if="game.finishDate" class="item-meta">
								{{ formatInstant(game.finishDate) }}
							</span>
						</li>
					</ul>
				</template>
			</div>

			<div v-if="activeTab === 'wishlist'" class="tab-content">
				<p v-if="userStore.getPlayerWishlistState.isLoading">Загрузка...</p>
				<p v-else-if="userStore.getPlayerWishlistState.isError">Ошибка загрузки</p>
				<template v-else-if="userStore.getPlayerWishlistState.isLoaded">
					<p v-if="!wishlist.length" class="empty-message">Вишлист пуст</p>
					<ol v-else class="wishlist">
						<li v-for="game in wishlist" :key="game.name">{{ game.name }}</li>
					</ol>
				</template>
			</div>

			<div v-if="activeTab === 'points'" class="tab-content">
				<p v-if="userStore.getPlayerPointsState.isLoading">Загрузка...</p>
				<p v-else-if="userStore.getPlayerPointsState.isError">Ошибка загрузки</p>
				<template v-else-if="userStore.getPlayerPointsState.isLoaded">
					<p v-if="!pointsInfo" class="empty-message">Нет данных</p>
					<dl v-else class="points-info">
						<div class="points-row">
							<dt>Опыт</dt>
							<dd>{{ pointsInfo.experiencePoints }}</dd>
						</div>
						<div class="points-row">
							<dt>Свободные очки</dt>
							<dd>{{ pointsInfo.freePoints }}</dd>
						</div>
						<div class="points-row">
							<dt>Очки территории</dt>
							<dd>{{ pointsInfo.territoryPoints }}</dd>
						</div>
						<div class="points-row">
							<dt>Часы территории</dt>
							<dd>{{ pointsInfo.territoryHours }}</dd>
						</div>
						<div class="points-row">
							<dt>Доступных бросков</dt>
							<dd>{{ pointsInfo.availableRolls }}</dd>
						</div>
					</dl>
				</template>
			</div>

			<div v-if="activeTab === 'effects'" class="tab-content">
				<p v-if="userStore.getPlayerEffectsState.isLoading">Загрузка...</p>
				<p v-else-if="userStore.getPlayerEffectsState.isError">Ошибка загрузки</p>
				<template v-else-if="userStore.getPlayerEffectsState.isLoaded">
					<p v-if="!wheelEffects.length" class="empty-message">Нет истории эффектов</p>
					<ul v-else class="item-list">
						<li v-for="(effect, i) in wheelEffects" :key="i" class="info-card info-card--row">
							<span class="item-title">{{ effect.name }}</span>
							<span class="item-meta">{{ formatInstant(effect.rollDate) }}</span>
						</li>
					</ul>
				</template>
			</div>
		</div>
	</UiView>
</template>

<style scoped>
.player-detail {
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

.player-header {
	display: flex;
	align-items: center;
	gap: 12px;
}

.player-name {
	font-size: 1.5rem;
	font-weight: 600;
}

.current-badge {
	font-size: 0.75rem;
	background-color: #e2e8f0;
	color: #475569;
	padding: 2px 8px;
	border-radius: 9999px;
}

.tabs {
	display: flex;
	border-bottom: 1px solid #e2e8f0;
}

.tab-button {
	padding: 8px 16px;
	background: none;
	border: none;
	border-bottom: 2px solid transparent;
	cursor: pointer;
	color: #64748b;
	font-size: 0.875rem;
	margin-bottom: -1px;
	position: relative;
}

.tab-button:hover {
	color: #0f172a;
}

.tab-button--active {
	color: #0f172a;
	border-bottom-color: #0f172a;
	font-weight: 500;
}

.tab-content {
	min-height: 80px;
}

.empty-message {
	color: #64748b;
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

.item-title {
	font-weight: 500;
}

.item-meta {
	font-size: 0.875rem;
	color: #64748b;
}

.wishlist {
	padding-left: 24px;
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.points-info {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.points-row {
	display: flex;
	justify-content: space-between;
	padding: 10px 16px;
	border: 1px solid #e2e8f0;
	border-radius: 4px;
}

.points-row dt {
	color: #475569;
}

.points-row dd {
	font-weight: 500;
	margin: 0;
}
</style>
