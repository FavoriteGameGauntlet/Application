<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiView from '../../components/ui/UiView.vue'
import UiTimestamp from '../../components/ui/UiTimestamp.vue'
import { LoadingStatus } from '../../utils/loadingState'
import { gameStateLabel } from '../../api-facade/models/games-models'
import { formatInstant } from '../../utils/temporal'
import { useAuthStore } from '../../stores/authStore'
import { useFeatureGameStore } from '../../stores/feature/featureGameStore'
import { useFeatureSystemParametersStore } from '../../stores/feature/featureSystemParametersStore'
import { useFeatureUserStore } from '../../stores/feature/featureUserStore'
import AddGameForm from './components/AddGameForm.vue'

const gameStore = useFeatureGameStore()
const systemParametersStore = useFeatureSystemParametersStore()
const userStore = useFeatureUserStore()

type Tab = 'current' | 'wishlist' | 'history'
const activeTab = ref<Tab>('current')

const { current, canRoll, wishlist, enoughGamesInWishlist } = storeToRefs(gameStore)
const { minimumNumberOfWishlistGames } = storeToRefs(systemParametersStore)

onMounted(() => {
	if (
		[LoadingStatus.ERROR, LoadingStatus.INIT].includes(
			gameStore.getWishlistState.status,
		)
	) {
		gameStore.getWishlist()
	}
})

const authStore = useAuthStore()

const gamesHistory = computed(
	() =>
		(authStore.login ? userStore.userHistory[authStore.login] : undefined) ??
		[],
)

watch(activeTab, (tab) => {
	if (tab === 'history' && authStore.login) {
		userStore.getUserHistory(authStore.login)
	}
})

const updateGamesOnLoginChange = () => {
	watch(
		() => authStore.login,
		(login) => {
			if (
				[LoadingStatus.ERROR, LoadingStatus.INIT].includes(
					gameStore.getWishlistState.status,
				) &&
				login
			) {
				gameStore.getWishlist()
			}
		},
		{ immediate: true },
	)
}

onMounted(() => {
	updateGamesOnLoginChange()
})
</script>

<template>
	<UiView class="games-view">
		<h1>Игры</h1>

		<div class="tabs">
			<button
				class="tab-button"
				:class="{ 'tab-button--active': activeTab === 'current' }"
				@click="activeTab = 'current'"
			>
				текущая
			</button>
			<button
				class="tab-button"
				:class="{ 'tab-button--active': activeTab === 'wishlist' }"
				@click="activeTab = 'wishlist'"
			>
				вишлист
			</button>
			<button
				class="tab-button"
				:class="{ 'tab-button--active': activeTab === 'history' }"
				@click="activeTab = 'history'"
			>
				история
			</button>
		</div>

		<div class="game-rolls" v-if="activeTab === 'current'">
			<div class="current-game-card" v-if="current">
				<div class="current-game-card__header">
					<span class="current-game-name">{{ current.name }}</span>
					<span class="game-status-badge">{{ gameStateLabel[current.state] }}</span>
				</div>
				<div class="current-game-elapsed">
					затрачено <UiTimestamp :time="current.timeSpent" />
				</div>
				<div class="current-game-actions">
					<UiButton class="status-button" @click="gameStore.cancel()">
						отменить
					</UiButton>

					<UiButton class="status-button" @click="gameStore.finish()">
						завершить
					</UiButton>
				</div>
			</div>

			<template v-else>
				<div class="roll-display">
					<div>Крути барабан</div>
				</div>

				<div class="action-row">
					<UiButton
						class="roll-button"
						:disabled="!canRoll"
						@click="gameStore.roll()"
					>
						Прокрутить
					</UiButton>
				</div>
			</template>
		</div>

		<div class="games-list" v-if="activeTab === 'wishlist'">
			<div class="container">
				<AddGameForm />

				<p class="hint" v-if="!enoughGamesInWishlist">
					Чтобы крутить следующую игру, надо {{ minimumNumberOfWishlistGames }} игр, нужно ещё
					{{ minimumNumberOfWishlistGames - wishlist.length }}.
				</p>

				<ul class="wishlist" v-if="wishlist.length">
					<li class="wishlist-item" :key="game.name" v-for="game in wishlist">
						{{ game.name }}
					</li>
				</ul>

				<p class="message" v-else>вишлист пуст</p>
			</div>
		</div>

		<div class="games-history" v-if="activeTab === 'history'">
			<p v-if="userStore.getUserHistoryState.isLoading">Загрузка...</p>
			<p v-else-if="userStore.getUserHistoryState.isError">Ошибка загрузки</p>
			<template v-else-if="userStore.getUserHistoryState.isLoaded">
				<p v-if="!gamesHistory.length" class="message">Нет истории игр</p>
				<ul v-else class="history-list">
					<li v-for="(game, i) in gamesHistory" :key="i" class="history-card">
						<span class="history-card__name">{{ game.name }}</span>
						<span class="history-card__meta">{{ gameStateLabel[game.state] }}</span>
						<span class="history-card__meta"
							><UiTimestamp :time="game.timeSpent"
						/></span>
						<span v-if="game.finishDate" class="history-card__meta">{{
							formatInstant(game.finishDate)
						}}</span>
						<span v-else class="history-card__meta">—</span>
					</li>
				</ul>
			</template>
		</div>
	</UiView>
</template>

<style scoped>
.games-view {
	height: 100%;
	overflow: auto;
}

.games-view > * {
	display: flex;
	flex-direction: column;
	width: 100%;
}

.game-rolls {
	display: flex;
	flex-direction: column;
	height: 100%;
	inline-size: 100%;
	place-content: center;
	gap: 48px;
	padding-bottom: 80px;
}

.roll-display {
	display: flex;
	height: 160px;
	width: 100%;
	align-items: center;
	justify-content: center;
	gap: 16px;
	border: 1px solid #e2e8f0;
}

.current-game-card {
	display: flex;
	flex-direction: column;
	gap: 6px;
	width: 100%;
	padding: 16px;
	border: 1px solid #e2e8f0;
	border-radius: 10px;
}

.current-game-card__header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.current-game-name {
	font-size: 1.0625rem;
	font-weight: 700;
}

.game-status-badge {
	font-size: 0.75rem;
	padding: 2px 10px;
	border: 1px solid #e2e8f0;
	border-radius: 20px;
	color: #64748b;
}

.current-game-elapsed {
	font-size: 0.8125rem;
	color: #64748b;
}

.current-game-actions {
	display: flex;
	gap: 10px;
	margin-top: 6px;
}

.status-button {
	height: 40px;
	width: 140px;
}

.roll-button {
	height: 60px;
	font-size: 1.25rem;
	width: 240px;
}

.action-row {
	display: flex;
	justify-content: center;
}

.games-list {
	display: flex;
	width: 100%;
	flex-direction: column;
	align-items: center;
	padding: 32px 48px;
}

.container {
	display: flex;
	width: 100%;
	flex-direction: column;
	gap: 32px;
}

.hint {
	width: fit-content;
	border-radius: 6px;
	background-color: #f1f5f9;
	padding: 8px 20px;
}

.wishlist {
	display: flex;
	flex-direction: column;
	gap: 8px;
	list-style: none;
	padding: 0;
	width: 100%;
}

.wishlist-item {
	padding: 10px 14px;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
}

.message {
	width: 100%;
}

.tabs {
	display: flex;
	gap: 18px;
	justify-content: center;
}

.tab-button {
	background: none;
	border: none;
	padding: 4px 0;
	cursor: pointer;
	color: #64748b;
	font-size: 1rem;
}

.tab-button--active {
	color: #0f172a;
	font-weight: 600;
}

.games-history {
	width: 100%;
	padding: 32px 48px;
}

.history-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
	list-style: none;
	padding: 0;
	width: 100%;
}

.history-card {
	display: grid;
	grid-template-columns: 1fr 90px 90px 110px;
	align-items: center;
	gap: 12px;
	padding: 10px 16px;
	border: 1px solid #e2e8f0;
	border-radius: 4px;
}

.history-card__name {
	font-weight: 500;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.history-card__meta {
	font-size: 0.875rem;
	color: #64748b;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	text-align: right;
}
</style>
