<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { TimerState, timerStateLabel } from '../../api-facade/models/timers-models.ts'
import UiButton from '../../components/ui/UiButton.vue'
import UiTimestamp from '../../components/ui/UiTimestamp.vue'
import { RouteName } from '../../router/routeNames'
import { useApiWheelStore } from '../../stores/api/apiWheelStore'
import { useFeatureGameStore } from '../../stores/feature/featureGameStore'
import { useFeatureTimerStore } from '../../stores/feature/featureTimerStore'
import UiView from '../../components/ui/UiView.vue'

const timerStore = useFeatureTimerStore()
const gameStore = useFeatureGameStore()
const wheelStore = useApiWheelStore()

const {
	durationTotal,
	remaining,
	state,
	loading: isTimerLoading,
} = storeToRefs(timerStore)
const { current: currentGame } = storeToRefs(gameStore)

const gameNameText = computed(() =>
	gameStore.getCurrentState.isLoading
		? 'Загрузка...'
		: (currentGame.value?.name ?? 'Крути новую игру'),
)

const progressPercent = computed(() => {
	const totalSeconds = durationTotal.value.total({ unit: 'seconds' })
	if (!totalSeconds) return 0

	const remainingSeconds = remaining.value.total({ unit: 'seconds' })
	return Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100))
})

const timerButtonLabel = computed(() =>
	state.value === TimerState.Running ? '⏸ пауза' : '▶ старт',
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

			<div class="timer">
				<div class="timer-badge">{{ state ? timerStateLabel[state] : '' }}</div>

				<UiTimestamp class="timer-time" :time="remaining" />

				<div class="timer-duration">
					длительность <UiTimestamp class="inline" :time="durationTotal" />
				</div>

				<div class="progress-bar">
					<div
						class="progress-bar__fill"
						:style="{ width: progressPercent + '%' }"
					></div>
				</div>

				<button
					class="timer-toggle"
					:disabled="isTimerLoading || !timerStore.canToggle"
					@click="onStartButtonClick"
				>
					{{ timerButtonLabel }}
				</button>
			</div>

			<div
				class="wheel-action"
				:class="{
					'wheel-action_disabled': wheelStore.availableRollCount === 0,
				}"
			>
				<RouterLink class="wheel-action-link" :to="{ name: RouteName.Wheel }">
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
	align-items: center;
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

.timer {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 14px;
}

.timer-badge {
	border: 1px solid #64748b;
	border-radius: 20px;
	padding: 4px 14px;
	font-size: 0.8125rem;
	color: #64748b;
}

.timer-time {
	font-size: 5rem;
	font-weight: 700;
	line-height: 1;
}

.timer-duration {
	color: #64748b;
	font-size: 0.9375rem;
}

.progress-bar {
	width: 340px;
	height: 10px;
	background-color: #e2e8f0;
	border-radius: 6px;
	overflow: hidden;
	margin-top: 6px;
}

.progress-bar__fill {
	height: 100%;
	background-color: #64748b;
}

.timer-toggle {
	margin-top: 20px;
	padding: 12px 32px;
	border: 1px solid #64748b;
	border-radius: 8px;
	background: transparent;
	cursor: pointer;
	font-size: 1.0625rem;
}

.timer-toggle:hover:not(:disabled) {
	background-color: #f1f5f9;
}

.timer-toggle:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.wheel-action {
	width: 100%;
	height: 80px;
	font-size: 1.5rem;
	margin-top: 32px;
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
