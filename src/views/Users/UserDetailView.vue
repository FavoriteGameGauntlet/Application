<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import UiView from '../../components/ui/UiView.vue'
import UiTimestamp from '../../components/ui/UiTimestamp.vue'
import { gameStateLabel } from '../../api-facade/models/games-models'
import {
	freePointChangeSourceLabel,
	territoryChangeSourceLabel,
} from '../../api-facade/models/points-models'
import { formatInstant } from '../../utils/temporal'
import { useAuthStore } from '../../stores/authStore'
import { useFeatureUserStore } from '../../stores/feature/featureUserStore'
import { RouteName } from '../../router/routeNames'

const route = useRoute()
const userStore = useFeatureUserStore()
const authStore = useAuthStore()

const login = computed(() => route.params.login as string)
const isCurrentUser = computed(() => login.value === authStore.login)
const displayName = computed(() => {
	const user = userStore.users?.find((u) => u.login === login.value)
	return user?.displayName ?? login.value
})

type Tab =
	| 'points'
	| 'game-wishlist'
	| 'game-history'
	| 'free-points-history'
	| 'territory-points-history'
	| 'wheel-effect-history'
const activeTab = ref<Tab>('points')

const tabs: { key: Tab; label: string; history?: true }[] = [
	{ key: 'points', label: 'Текущие очки' },
	{ key: 'game-wishlist', label: 'Вишлист' },
	{ key: 'game-history', label: 'Игры', history: true },
	{ key: 'free-points-history', label: 'Свободные очки', history: true },
	{ key: 'territory-points-history', label: 'Очки территории', history: true },
	{ key: 'wheel-effect-history', label: 'Эффекты колеса', history: true },
]

const currentGame = computed(
	() => userStore.userCurrentGame[login.value] ?? null,
)
const gameHistory = computed(() => userStore.userHistory[login.value] ?? [])
const gameWishlist = computed(() => userStore.userWishlist[login.value] ?? [])
const pointsInfo = computed(() => userStore.userPoints[login.value] ?? null)
const freePointsHistory = computed(
	() => userStore.userFreePointsHistory[login.value] ?? [],
)
const territoryPointsHistory = computed(
	() => userStore.userTerritoryPointsHistory[login.value] ?? [],
)
const wheelEffectHistory = computed(
	() => userStore.userEffects[login.value] ?? [],
)

const loadAll = () => {
	userStore.getUserCurrentGame(login.value)
	userStore.getUserHistory(login.value)
	userStore.getUserWishlist(login.value)
	userStore.getUserPoints(login.value)
	userStore.getUserFreePointsHistory(login.value)
	userStore.getUserTerritoryPointsHistory(login.value)
	userStore.getUserEffects(login.value)
}

onMounted(loadAll)
watch(login, loadAll)
</script>

<template>
	<UiView>
		<div class="user-detail">
			<RouterLink :to="{ name: RouteName.Users }" class="back-link"
				>← Игроки</RouterLink
			>

			<div class="user-header">
				<h1 class="user-name">{{ displayName }}</h1>
				<span v-if="isCurrentUser" class="current-badge">Вы</span>
			</div>

			<div class="current-game">
				<template v-if="userStore.getUserCurrentGameState.isLoaded">
					<p v-if="!currentGame" class="empty-message">Игра не выбрана</p>
					<dl v-else class="current-game__table">
						<div class="current-game__row">
							<dt>Игра</dt>
							<dd>{{ currentGame.name }}</dd>
						</div>
						<div class="current-game__row">
							<dt>Статус</dt>
							<dd>{{ gameStateLabel[currentGame.state] }}</dd>
						</div>
						<div class="current-game__row">
							<dt>Время</dt>
							<dd><UiTimestamp :time="currentGame.timeSpent" /></dd>
						</div>
					</dl>
				</template>
			</div>

			<div class="tabs">
				<button
					v-for="t in tabs"
					:key="t.key"
					class="tab-button"
					:class="{ 'tab-button--active': activeTab === t.key }"
					@click="activeTab = t.key"
				>
					<span v-if="t.history" class="tab-history-badge">История</span>
					{{ t.label }}
				</button>
			</div>

			<div v-if="activeTab === 'game-history'" class="tab-content">
				<p v-if="userStore.getUserHistoryState.isLoading">Загрузка...</p>
				<p v-else-if="userStore.getUserHistoryState.isError">Ошибка загрузки</p>
				<template v-else-if="userStore.getUserHistoryState.isLoaded">
					<p v-if="!gameHistory.length" class="empty-message">
						Нет истории игр
					</p>
					<ul v-else class="item-list">
						<li v-for="(game, i) in gameHistory" :key="i" class="info-card">
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
							<div v-if="game.finishDate" class="info-card__row">
								<span class="item-meta">Завершена</span>
								<span class="item-meta">{{
									formatInstant(game.finishDate)
								}}</span>
							</div>
						</li>
					</ul>
				</template>
			</div>

			<div v-if="activeTab === 'game-wishlist'" class="tab-content">
				<p v-if="userStore.getUserWishlistState.isLoading">Загрузка...</p>
				<p v-else-if="userStore.getUserWishlistState.isError">
					Ошибка загрузки
				</p>
				<template v-else-if="userStore.getUserWishlistState.isLoaded">
					<p v-if="!gameWishlist.length" class="empty-message">Вишлист пуст</p>
					<p class="item-count">{{ gameWishlist.length }} игр</p>
					<ul class="item-list">
						<li v-for="game in gameWishlist" :key="game.name" class="info-card">
							<span class="item-title">{{ game.name }}</span>
						</li>
					</ul>
				</template>
			</div>

			<div v-if="activeTab === 'points'" class="tab-content">
				<p v-if="userStore.getUserPointsState.isLoading">Загрузка...</p>
				<p v-else-if="userStore.getUserPointsState.isError">Ошибка загрузки</p>
				<template v-else-if="userStore.getUserPointsState.isLoaded">
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

			<div v-if="activeTab === 'free-points-history'" class="tab-content">
				<p v-if="userStore.getUserFreePointsHistoryState.isLoading">
					Загрузка...
				</p>
				<p v-else-if="userStore.getUserFreePointsHistoryState.isError">
					Ошибка загрузки
				</p>
				<template v-else-if="userStore.getUserFreePointsHistoryState.isLoaded">
					<p v-if="!freePointsHistory.length" class="empty-message">
						Нет истории
					</p>
					<ul v-else class="item-list">
						<li
							v-for="(entry, i) in freePointsHistory"
							:key="i"
							class="info-card"
						>
							<div class="info-card__row">
								<span class="item-title">{{
									freePointChangeSourceLabel[entry.changeSource]
								}}</span>
								<span class="item-meta">{{
									formatInstant(entry.changeDate)
								}}</span>
							</div>
							<div v-if="entry.wheelEffectName" class="info-card__row">
								<span class="item-meta">Эффект</span>
								<span class="item-meta">{{ entry.wheelEffectName }}</span>
							</div>
							<div v-if="entry.sourceLogin" class="info-card__row">
								<span class="item-meta">От</span>
								<span class="item-meta">{{ entry.sourceLogin }}</span>
							</div>
							<div class="info-card__row">
								<span class="item-meta">Изменение</span>
								<span class="item-meta"
									>{{ entry.actualChangeValue > 0 ? '+' : ''
									}}{{ entry.actualChangeValue }}</span
								>
							</div>
							<div class="info-card__row">
								<span class="item-meta">Итог</span>
								<span class="item-meta">{{ entry.finalValue }}</span>
							</div>
						</li>
					</ul>
				</template>
			</div>

			<div v-if="activeTab === 'territory-points-history'" class="tab-content">
				<p v-if="userStore.getUserTerritoryPointsHistoryState.isLoading">
					Загрузка...
				</p>
				<p v-else-if="userStore.getUserTerritoryPointsHistoryState.isError">
					Ошибка загрузки
				</p>
				<template
					v-else-if="userStore.getUserTerritoryPointsHistoryState.isLoaded"
				>
					<p v-if="!territoryPointsHistory.length" class="empty-message">
						Нет истории
					</p>
					<ul v-else class="item-list">
						<li
							v-for="(entry, i) in territoryPointsHistory"
							:key="i"
							class="info-card"
						>
							<div class="info-card__row">
								<span class="item-title">{{
									territoryChangeSourceLabel[entry.changeSource]
								}}</span>
								<span class="item-meta">{{
									formatInstant(entry.changeDate)
								}}</span>
							</div>
							<div v-if="entry.sourceLogin" class="info-card__row">
								<span class="item-meta">От</span>
								<span class="item-meta">{{ entry.sourceLogin }}</span>
							</div>
							<div class="info-card__row">
								<span class="item-meta">Изменение</span>
								<span class="item-meta"
									>{{ entry.actualChangeValue > 0 ? '+' : ''
									}}{{ entry.actualChangeValue }}</span
								>
							</div>
							<div class="info-card__row">
								<span class="item-meta">Итог</span>
								<span class="item-meta">{{ entry.finalValue }}</span>
							</div>
						</li>
					</ul>
				</template>
			</div>

			<div v-if="activeTab === 'wheel-effect-history'" class="tab-content">
				<p v-if="userStore.getUserEffectsState.isLoading">Загрузка...</p>
				<p v-else-if="userStore.getUserEffectsState.isError">Ошибка загрузки</p>
				<template v-else-if="userStore.getUserEffectsState.isLoaded">
					<p v-if="!wheelEffectHistory.length" class="empty-message">
						Нет истории эффектов
					</p>
					<ul v-else class="item-list">
						<li
							v-for="(effect, i) in wheelEffectHistory"
							:key="i"
							class="info-card info-card--row"
						>
							<span class="item-title">{{ effect.name }}</span>
							<span class="item-meta">{{
								formatInstant(effect.rollDate)
							}}</span>
						</li>
					</ul>
				</template>
			</div>
		</div>
	</UiView>
</template>

<style scoped>
.user-detail {
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

.user-header {
	display: flex;
	align-items: center;
	gap: 12px;
}

.user-name {
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

.current-game__table {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.current-game__row {
	display: flex;
	justify-content: space-between;
	padding: 10px 16px;
	border: 1px solid #e2e8f0;
	border-radius: 4px;
}

.current-game__row dt {
	color: #475569;
}

.current-game__row dd {
	font-weight: 500;
	margin: 0;
}

.tabs {
	display: flex;
	border-bottom: 1px solid #e2e8f0;
	padding-top: 10px;
}

.tab-button {
	flex: 1;
	padding: 8px 4px;
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

.tab-history-badge {
	position: absolute;
	top: -8px;
	left: 50%;
	transform: translateX(-50%);
	font-size: 0.6rem;
	background-color: #e2e8f0;
	color: #475569;
	padding: 1px 4px;
	border-radius: 4px;
	white-space: nowrap;
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

.item-count {
	font-size: 0.875rem;
	color: #94a3b8;
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
