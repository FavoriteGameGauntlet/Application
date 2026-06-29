<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { TimerState } from '../../api-facade/models/timers-models.ts'
import UiButton from '../../components/ui/UiButton.vue'
import UiTimestamp from '../../components/ui/UiTimestamp.vue'
import { RouteName } from '../../router/routeNames'
import { useApiWheelStore } from '../../stores/api/apiWheelStore'
import { useFeatureGameStore } from '../../stores/feature/featureGameStore'
import { useFeatureTimerStore } from '../../stores/feature/featureTimerStore'
import GameTimer from './components/GameTimer.vue'
import WheelTimer from './components/WheelTimer.vue'
import UiView from '../../components/ui/UiView.vue'

const timerStore = useFeatureTimerStore()
const gameStore = useFeatureGameStore()
const wheelStore = useApiWheelStore()

const {
	durationTotal,
	state,
	loading: isTimerLoading,
} = storeToRefs(timerStore)
const { current: currentGame } = storeToRefs(gameStore)

const gameNameText = computed(() =>
	gameStore.getCurrentState.isLoading
		? 'Загрузка...'
		: (currentGame.value?.name ?? 'Крути новую игру'),
)

const timerButtonSvg = computed(() =>
	state.value === TimerState.Running
		? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'
		: '<path d="M8 5v14l11-7z"/>',
)

const onStartButtonClick = () => {
	timerStore.toggle()
}
</script>

<template>
	<UiView>
		<div class="container">
			<RouterLink class="game-link" :to="{ name: RouteName.Games }">
				{{ gameNameText }}
			</RouterLink>

			<WheelTimer class="wheel-timer" />

			<div class="controls-grid">
				<button
					class="play-button"
					:disabled="isTimerLoading || !timerStore.canToggle"
					@click="onStartButtonClick"
				>
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="currentColor"
						v-html="timerButtonSvg"
					></svg>
				</button>

				<div class="total-time">
					/ <UiTimestamp class="inline" :time="durationTotal" />
				</div>

				<div class="game-time">
					В игре:
					<GameTimer class="inline" />
				</div>
			</div>

			<div
				class="wheel-action"
				:class="{
					'wheel-action_disabled': wheelStore.availableRollCount === 0,
				}"
			>
				<RouterLink class="wheel-action-link" :to="{ name: RouteName.Effects }">
					<UiButton class="wheel-action-button">{{
						wheelStore.availableRollCount > 0
							? 'Крути колесо!'
							: 'Ждём таймер...'
					}}</UiButton>
				</RouterLink>
			</div>
		</div>
	</UiView>
</template>

<style scoped>
.container {
	display: flex;
	width: min-content;
	flex-direction: column;
	gap: 16px;
	margin-bottom: 68px;
}

.game-link {
	width: fit-content;
	max-width: fit-content;
	overflow: auto;
	font-size: 1.875rem;
	font-weight: 700;
	line-height: 1.5;
}

.wheel-timer {
	width: fit-content;
	min-width: fit-content;
	flex-shrink: 0;
	font-size: 6rem;
	font-weight: 700;
}

.controls-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	grid-template-rows: repeat(2, 1fr);
}

.play-button {
	grid-row: span 2;
	width: fit-content;
	border: 2px solid black;
	padding: 12px 20px;
	font-size: 0.1rem;
}

.play-button:not(:disabled) {
	cursor: pointer;
}

.play-button:disabled {
	opacity: 0.5;
}

.total-time {
	width: fit-content;
	place-self: end start;
	justify-self: end;
	font-size: 1.25rem;
	font-family: monospace;
}

.game-time {
	width: fit-content;
	place-self: end;
	font-size: 1.25rem;
}

.wheel-action {
	height: 80px;
	font-size: 1.5rem;
}

.wheel-action_disabled {
	pointer-events: none;
	user-select: none;
	cursor: default;
	opacity: 0.4;
}

.wheel-action-link {
	display: block;
	width: 100%;
}

.wheel-action-button {
	height: 72px;
}
</style>
