<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useClickOutside } from '../composables/useClickOutside'
import { RouteName } from '../router/routeNames'
import { useCurrentGameStore } from '../stores/currentGameStore'
import { useTimerStore } from '../stores/timerStore'
import { useWheelStore } from '../stores/wheelStore'
import { formatClock, formatHours } from '../utils/format'
import RewardPopover from './RewardPopover.vue'
import UiBadge from './ui/UiBadge.vue'
import UiButton from './ui/UiButton.vue'
import UiIcon from './ui/UiIcon.vue'

type Props = {
	/** the timer block is shown on the home screen only */
	withTimer?: boolean
}

defineProps<Props>()

const router = useRouter()
const currentGameStore = useCurrentGameStore()
const timerStore = useTimerStore()
const wheelStore = useWheelStore()

const card = useTemplateRef('card')

const gameInfoOpen = ref(false)
const timerInfoOpen = ref(false)
const menuOpen = ref(false)

useClickOutside(card, () => {
	gameInfoOpen.value = false
	timerInfoOpen.value = false
	menuOpen.value = false
})

const game = computed(() => currentGameStore.current?.game)

const ring = computed(
	() => `${((113.1 * timerStore.elapsed) / timerStore.goal).toFixed(1)} 113.1`,
)

const goToWheelGames = () => {
	wheelStore.setTab('games')
	router.push({ name: RouteName.Wheel })
}

const onComplete = () => {
	menuOpen.value = false
	currentGameStore.complete()
}

const onReroll = () => {
	menuOpen.value = false
	currentGameStore.reroll()
}

const onCancel = () => {
	menuOpen.value = false
	currentGameStore.cancel()
}
</script>

<template>
	<div ref="card" class="current-game">
		<span class="current-game__accent"></span>

		<div class="current-game__row">
			<div class="current-game__info">
				<span class="current-game__label-row">
					<span class="label">Текущая игра</span>

					<template v-if="game">
						<button
							class="info-button"
							aria-label="Награда за прохождение"
							title="Награда за прохождение"
							:aria-expanded="gameInfoOpen"
							@click="gameInfoOpen = !gameInfoOpen"
						>
							<UiIcon name="info" :size="16" />
						</button>

						<UiBadge>
							Сыграно: {{ formatHours(currentGameStore.current?.playedSeconds ?? 0) }}
						</UiBadge>
					</template>

					<RewardPopover
						v-if="gameInfoOpen"
						class="popover popover--game"
						title="Награда за прохождение"
						:rows="currentGameStore.current?.completionReward ?? []"
					/>
				</span>

				<span
					class="current-game__name"
					:class="{ 'current-game__name--empty': !game }"
				>
					{{ game?.name ?? 'Нет текущей игры' }}
				</span>
			</div>

			<div v-if="game" class="split">
				<UiButton class="split__main" variant="outline" icon="check" @click="onComplete">
					Завершить
				</UiButton>
				<UiButton
					class="split__toggle"
					:class="{ 'split__toggle--open': menuOpen }"
					variant="outline"
					:icon="menuOpen ? 'chevron-up' : 'chevron-down'"
					aria-label="Другие действия"
					:aria-expanded="menuOpen"
					@click="menuOpen = !menuOpen"
				/>

				<div v-if="menuOpen" class="menu">
					<div class="menu__item" @click="onReroll">
						<div class="menu__title">Перекрутить</div>
						<div class="menu__hint">новая случайная игра</div>
					</div>
					<div class="menu__item" @click="onCancel">
						<div class="menu__title">Отменить игру</div>
						<div class="menu__hint">без новой игры</div>
					</div>
				</div>
			</div>

			<UiButton v-else variant="outline" icon="refresh-cw" @click="goToWheelGames">
				Выбрать на колесе
			</UiButton>
		</div>

		<div v-if="withTimer" class="timer">
			<svg class="timer__ring" width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
				<circle cx="22" cy="22" r="18" fill="none" stroke="var(--surface-sunken)" stroke-width="6" />
				<circle
					cx="22"
					cy="22"
					r="18"
					fill="none"
					stroke="var(--accent)"
					stroke-width="6"
					stroke-linecap="round"
					:stroke-dasharray="ring"
				/>
			</svg>

			<div class="timer__info">
				<span class="current-game__label-row">
					<span class="label">Таймер</span>
					<button
						class="info-button"
						aria-label="Награда за таймер"
						title="Награда за таймер"
						:aria-expanded="timerInfoOpen"
						@click="timerInfoOpen = !timerInfoOpen"
					>
						<UiIcon name="info" :size="16" />
					</button>
				</span>
				<span class="timer__time">
					<span class="timer__elapsed">{{ formatClock(timerStore.elapsed) }}</span>
					<span class="timer__goal">/ {{ formatClock(timerStore.goal).slice(1) }}</span>
				</span>
			</div>

			<RewardPopover
				v-if="timerInfoOpen"
				class="popover popover--timer"
				title="Награда за таймер"
				:rows="timerStore.timer?.reward ?? []"
			/>

			<div class="timer__spacer"></div>

			<UiButton
				class="timer__toggle"
				:icon="timerStore.isRunning ? 'pause' : 'play'"
				@click="timerStore.toggle()"
			>
				{{ timerStore.isRunning ? 'Пауза' : 'Старт' }}
			</UiButton>
		</div>
	</div>
</template>

<style scoped>
.current-game {
	position: relative;
	z-index: 3;
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 14px 16px 14px 20px;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.current-game__accent {
	position: absolute;
	top: 0;
	left: 20px;
	width: 40px;
	height: 4px;
	background: var(--accent);
	border-radius: 0 0 2px 2px;
}

.current-game__row {
	display: flex;
	align-items: center;
	gap: 16px;
}

.current-game__info {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 8px;
	min-width: 0;
}

.current-game__label-row {
	position: relative;
	display: flex;
	align-items: center;
	gap: 6px;
	height: 16px;
}

.label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.current-game__name {
	overflow: hidden;
	font: var(--type-h3);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	text-overflow: ellipsis;
	white-space: nowrap;
	color: var(--text-strong);
}

.current-game__name--empty {
	color: var(--text-muted);
}

.info-button {
	display: flex;
	flex: none;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	margin: -4px 0;
	color: var(--text-muted);
	border-radius: var(--radius-xs);
	cursor: pointer;
}

.info-button:hover {
	color: var(--text-strong);
	background: var(--surface-sunken);
}

.popover {
	position: absolute;
}

.popover--game {
	top: 28px;
	left: 0;
}

.popover--timer {
	top: 74px;
	left: 56px;
}

.split {
	position: relative;
	display: flex;
}

.split .split__main {
	width: 150px;
	border-top-right-radius: 0;
	border-bottom-right-radius: 0;
}

.split .split__toggle {
	gap: 0;
	padding: 0 10px;
	margin-left: -2px;
	border-top-left-radius: 0;
	border-bottom-left-radius: 0;
}

.split .split__toggle--open {
	background: var(--surface-sunken);
}

.menu {
	position: absolute;
	top: 48px;
	right: 0;
	z-index: 4;
	display: flex;
	flex-direction: column;
	gap: 2px;
	width: 248px;
	padding: 4px;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-md);
	box-shadow: var(--shadow-3);
}

.menu__item {
	padding: 10px 12px;
	border-radius: var(--radius-sm);
	cursor: pointer;
}

.menu__item:hover {
	background: var(--surface-sunken);
}

.menu__title {
	font: 600 14px / 1.45 var(--font-body);
	color: var(--text-strong);
}

.menu__hint {
	font: var(--type-caption);
	color: var(--text-muted);
}

.timer {
	position: relative;
	display: flex;
	align-items: center;
	gap: 12px;
	padding-top: 14px;
	border-top: 1px solid var(--border-subtle);
}

.timer__ring {
	flex: none;
	transform: rotate(-90deg);
}

.timer__info {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.timer__time {
	display: flex;
	align-items: baseline;
	gap: 8px;
}

.timer__elapsed {
	font: 800 24px / 1 var(--font-display);
	font-variant-numeric: tabular-nums;
	color: var(--text-strong);
}

.timer__goal {
	font: var(--type-mono);
	color: var(--text-muted);
}

.timer__spacer {
	flex: 1;
}

.timer .timer__toggle {
	width: 188px;
}
</style>
