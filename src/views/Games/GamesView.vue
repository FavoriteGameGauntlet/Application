<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, ref, watch } from 'vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiView from '../../components/ui/UiView.vue'
import { LoadingStatus } from '../../utils/loadingState'
import { useAuthStore } from '../../stores/authStore'
import { useFeatureGameStore } from '../../stores/feature/featureGameStore'
import AddGameForm from './components/AddGameForm.vue'

const gameStore = useFeatureGameStore()

const { current, canRoll, wishlist } = storeToRefs(gameStore)
const showCountHint = ref(false)

gameStore.getWishlistState.on([LoadingStatus.LOADED]).then(() => {
	showCountHint.value = !gameStore.enoughGamesInWishlist
})

const rollText = ref('Загрузка...')

gameStore.getCurrentState.on([LoadingStatus.LOADED]).then(() => {
	watch(
		current,
		() => {
			rollText.value = current.value?.name ?? 'Крути барабан'
		},
		{ immediate: true },
	)
})

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

		<div class="game-rolls">
			<div class="roll-display">
				<div>{{ rollText }}</div>
			</div>

			<div class="status-container">
				<p v-if="current" class="current-game">
					Ты сейчас играешь в {{ current?.name }}.
				</p>

				<span class="status-row" v-if="current">
					<UiButton class="status-button" @click="gameStore.finish()">
						Закончить
					</UiButton>

					<UiButton class="status-button" @click="gameStore.cancel()">
						Бросить
					</UiButton>
				</span>
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
		</div>

		<div class="games-list">
			<div class="container">
				<AddGameForm />

				<p class="hint" v-if="showCountHint">
					Чтобы крутить следующую игру, надо 6 игр, нужно ещё
					{{ 6 - wishlist.length }}.
				</p>

				<ol class="game-list" v-if="wishlist.length">
					<li :key="game.name" v-for="game in wishlist">
						{{ game.name }}
					</li>
				</ol>

				<p class="message" v-else>У тебя ещё нет игр!</p>
			</div>
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

.effects-link {
	place-self: center;
	color: #3b82f6;
}

.effects-link:hover {
	text-decoration: underline;
}

.title {
	text-align: center;
	font-size: 2.25rem;
	font-weight: 600;
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

.status-container {
	border-radius: 6px;
	background-color: #e2e8f0;
	padding: 16px 32px;
	width: 100%;
}

.status-container:empty {
	display: none;
}

.status-row {
	display: flex;
	gap: 8px;
}

.current-game {
	display: flex;
	width: 100%;
	align-items: center;
	gap: 16px;
}

.status-button {
	height: 72px;
}

.info-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	color: #0f172a;
}

.add-games-link {
	box-sizing: border-box;
	border: 2px solid #3b82f6;
	padding: 8px 16px;
	color: #3b82f6;
}

.add-games-link:hover {
	text-decoration: underline;
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

.title {
	font-size: 2.25rem;
}

.add-form {
	display: flex;
	gap: 16px;
}

.game-input {
	width: 320px;
	border-radius: 6px;
	border: 1px solid #cbd5e1;
	background-color: #f1f5f9;
	padding: 4px 12px;
}

.submit-button {
	cursor: pointer;
	background-color: #f1f5f9;
	padding: 4px 16px;
}

.submit-button:hover {
	background-color: #e2e8f0;
}

.submit-button:disabled {
	color: #64748b;
}

.hint {
	width: fit-content;
	border-radius: 6px;
	background-color: #f1f5f9;
	padding: 8px 20px;
}

.game-list {
	display: flex;
	flex-direction: column;
	padding-left: 40px;
	list-style: decimal;
}

.message {
	width: 100%;
}
</style>

<script setup lang="ts"></script>
