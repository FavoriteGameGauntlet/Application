<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import AppLogo from '../../../components/AppLogo.vue'
import UiButton from '../../../components/ui/UiButton.vue'
import UiIconButton from '../../../components/ui/UiIconButton.vue'
import { useCurrentGameStore } from '../../../stores/currentGameStore'
import { MINI_SIZE, useMiniModeStore } from '../../../stores/miniModeStore'
import { useTimerStore } from '../../../stores/timerStore'

const currentGameStore = useCurrentGameStore()
const miniModeStore = useMiniModeStore()
const timerStore = useTimerStore()

const root = useTemplateRef('root')

/** how many times the content is bigger than at the size it is designed for */
const zoom = ref(1)

let observer: ResizeObserver | undefined

onMounted(() => {
	observer = new ResizeObserver(([entry]) => {
		const { width, height } = entry.contentRect

		zoom.value = Math.min(width / MINI_SIZE.width, height / MINI_SIZE.height)
	})

	observer.observe(root.value!)
})

onUnmounted(() => observer?.disconnect())

const hasGame = computed(() => !!currentGameStore.current?.game)

/** the ring has pathLength of 100, so the dash is just the percent */
const ring = computed(
	() =>
		`${Math.min(100, (100 * timerStore.elapsed) / timerStore.goal).toFixed(1)} 100`,
)
</script>

<template>
	<!-- the window has no frame, so the empty space is what it is dragged by -->
	<div ref="root" class="mini" data-tauri-drag-region>
		<div
			class="mini__body"
			:style="{
				width: `${MINI_SIZE.width}px`,
				height: `${MINI_SIZE.height}px`,
				zoom: String(zoom),
			}"
			data-tauri-drag-region
		>
			<AppLogo class="mini__logo" symbol :height="28" />

			<UiIconButton
				class="mini__expand"
				size="sm"
				icon="maximize-2"
				label="Развернуть"
				@click="miniModeStore.toggle()"
			/>

			<div class="mini__clock">
				<svg class="mini__ring" viewBox="0 0 176 176" aria-hidden="true">
					<circle
						cx="88"
						cy="88"
						r="80"
						fill="none"
						stroke="var(--surface-sunken)"
						stroke-width="12"
					/>
					<circle
						cx="88"
						cy="88"
						r="80"
						fill="none"
						stroke="var(--accent)"
						stroke-width="12"
						stroke-linecap="round"
						pathLength="100"
						:stroke-dasharray="ring"
					/>
				</svg>

				<template v-if="timerStore.clock">
					<span class="mini__elapsed">{{ timerStore.clock.remaining }}</span>
					<span class="mini__goal">/ {{ timerStore.clock.goal }}</span>
				</template>
				<template v-else>
					<span
						class="mini__elapsed mini__bar mini__bar--elapsed"
						aria-hidden="true"
					></span>
					<span class="mini__goal" aria-hidden="true">
						/ <span class="mini__bar mini__bar--goal"></span>
					</span>
				</template>
			</div>

			<UiButton
				full-width
				:icon="timerStore.isRunning ? 'pause' : 'play'"
				:disabled="!hasGame"
				:title="hasGame ? undefined : 'Нет текущей игры'"
				@click="timerStore.toggle()"
			>
				{{ timerStore.isRunning ? 'Пауза' : 'Старт' }}
			</UiButton>
		</div>
	</div>
</template>

<style scoped>
.mini {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	overflow: hidden;
	background: var(--surface-card);
}

.mini__body {
	position: relative;
	display: flex;
	flex: none;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	padding: 12px;
}

/* in the corners of the square around the ring, where the ring itself is not */
.mini__logo {
	position: absolute;
	top: 8px;
	left: 8px;
	pointer-events: none;
}

.mini__expand {
	position: absolute;
	top: 4px;
	right: 4px;
}

/* the clicks pass through to the draggable background */
.mini__clock {
	position: relative;
	width: 176px;
	height: 176px;
	pointer-events: none;
}

.mini__ring {
	width: 100%;
	height: 100%;
	transform: rotate(-90deg);
}

/* the current time sits in the very center, the goal hangs under it */
.mini__elapsed,
.mini__goal {
	position: absolute;
	left: 0;
	right: 0;
	text-align: center;
}

.mini__elapsed {
	top: 50%;
	font: 800 26px / 1 var(--font-display);
	font-variant-numeric: tabular-nums;
	color: var(--text-strong);
	transform: translateY(-50%);
}

.mini__goal {
	top: calc(50% + 22px);
	font: var(--type-mono);
	color: var(--text-muted);
}

/* stand in for the clock while there is no timer */
.mini__bar {
	background: var(--surface-sunken);
	border-radius: var(--radius-xs);
}

/* the fixed width with auto margins centers it */
.mini__bar--elapsed {
	width: 112px;
	height: 26px;
	margin: 0 auto;
}

.mini__bar--goal {
	display: inline-block;
	vertical-align: middle;
	width: 56px;
	height: 14px;
}
</style>
