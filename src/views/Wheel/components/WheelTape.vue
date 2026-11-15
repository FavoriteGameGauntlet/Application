<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

type Props = {
	entries: string[]
	/** the index the tape rolls to; set while a spin is landing */
	target?: number
	/** the index of the shown result */
	winner?: number
	busy?: boolean
	emptyText: string
}

type Phase = 'idle' | 'spin' | 'hold' | 'settle' | 'result'

const {
	entries,
	target,
	winner,
	busy = false,
	emptyText,
} = defineProps<Props>()

const emit = defineEmits<{ landed: [] }>()

const PITCH = 232
const SPIN_MS = 6200
const HOLD_MS = 700
const SETTLE_MS = 450
const MIN_TURNS = 30
/** the spin stops past the winner and snaps back into the frame */
const OVERSHOOT = 0.42
const OFFSETS = [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5]
const STREAK_WIDTHS = [180, 260, 140, 300, 200, 160]
const STREAK_TOPS = [52, 92, 138, 170, 214, 248]

const mod = (a: number, n: number) => ((a % n) + n) % n

const pos = ref(winner ?? 0)
const speed = ref(0)
const phase = ref<Phase>(winner === undefined ? 'idle' : 'result')

let frame = 0

const run = (to: number) => {
	const n = entries.length
	const start = pos.value
	const tail = to + OVERSHOOT
	const stop = tail + n * Math.ceil((start + MIN_TURNS - tail) / n)
	const land = stop - OVERSHOOT
	const t0 = performance.now()

	phase.value = 'spin'

	const step = (now: number) => {
		const t = now - t0

		if (t < SPIN_MS) {
			const p = t / SPIN_MS

			pos.value = start + (stop - start) * (1 - Math.pow(1 - p, 4))
			speed.value = ((stop - start) * 4 * Math.pow(1 - p, 3)) / (SPIN_MS / 1000)
		} else if (t < SPIN_MS + HOLD_MS) {
			pos.value = stop
			speed.value = 0
			phase.value = 'hold'
		} else if (t < SPIN_MS + HOLD_MS + SETTLE_MS) {
			// easeOutBack: the card runs a little past the frame and comes back
			const q = (t - SPIN_MS - HOLD_MS) / SETTLE_MS
			const c1 = 1.70158
			const e = 1 + (c1 + 1) * Math.pow(q - 1, 3) + c1 * Math.pow(q - 1, 2)

			pos.value = stop + (land - stop) * e
			phase.value = 'settle'
		} else {
			pos.value = mod(land, n)
			phase.value = 'result'
			frame = 0
			emit('landed')
			return
		}

		frame = requestAnimationFrame(step)
	}

	frame = requestAnimationFrame(step)
}

watch(
	() => target,
	(to) => {
		if (to !== undefined && entries.length) run(to)
	},
	// a spin that started before the tape was mounted still lands
	{ immediate: true },
)

watch(
	() => winner,
	(w) => {
		if (frame) return

		if (w === undefined) {
			phase.value = 'idle'
		} else {
			pos.value = w
			phase.value = 'result'
		}
	},
)

watch(
	() => entries,
	() => {
		if (!frame && winner === undefined) pos.value = 0
	},
)

onBeforeUnmount(() => cancelAnimationFrame(frame))

const empty = computed(() => !entries.length)
const result = computed(() => phase.value === 'result' && !empty.value)
const moving = computed(() => phase.value === 'spin' || phase.value === 'hold')

const cards = computed(() => {
	const n = entries.length
	const base = Math.floor(pos.value)
	const blur = speed.value > 2 ? Math.min(5, speed.value * 0.2) : 0

	return OFFSETS.map((k) => {
		const i = base + k
		const d = i - pos.value
		const x = d * PITCH
		const fade = Math.max(0, 1 - Math.pow(Math.abs(x) / 620, 2))
		const isWin = result.value && Math.abs(d) < 0.5
		const scale = isWin ? 1.16 : 1 + 0.1 * Math.max(0, 1 - Math.abs(d))
		const dimmed = result.value && !isWin ? 0.22 : 1

		return {
			key: k,
			text: n ? entries[mod(i, n)] : '',
			win: isWin,
			style: {
				left: `calc(50% + ${x - 108}px)`,
				transform: `scale(${scale})`,
				opacity: fade * dimmed * (busy ? 0.5 : 1),
				filter: blur > 0.3 ? `blur(${blur}px)` : 'none',
			},
		}
	})
})

const streaks = computed(() => {
	const strength = Math.min(1, speed.value / 18)

	if (strength <= 0.05) return []

	return STREAK_WIDTHS.map((w, i) => ({
		key: i,
		style: {
			top: `${STREAK_TOPS[i]}px`,
			left: `${1300 - ((pos.value * PITCH * (0.55 + 0.12 * i) + i * 230) % 1700)}px`,
			width: `${w}px`,
			opacity: (i % 2 ? 0.55 : 0.3) * strength,
		},
	}))
})
</script>

<template>
	<div
		class="tape"
		:class="{
			'tape--active': phase !== 'idle',
			'tape--moving': moving,
			'tape--result': result,
			'tape--busy': busy,
		}"
	>
		<div
			v-for="card in cards"
			:key="card.key"
			class="card"
			:class="{ 'card--win': card.win, 'card--ghost': empty }"
			:style="card.style"
		>
			<span class="card__hex"></span>
			<span class="card__text">{{ card.text }}</span>
		</div>

		<span
			v-for="streak in streaks"
			:key="streak.key"
			class="streak"
			:style="streak.style"
		></span>

		<span class="frame"></span>
		<span class="mark mark--top"></span>
		<span class="mark mark--bottom"></span>

		<div v-if="empty" class="empty">{{ emptyText }}</div>
	</div>
</template>

<style scoped>
.tape {
	--frame-w: 256px;
	--frame-h: 178px;
	--frame-color: var(--border-default);

	position: relative;
	height: 296px;
	overflow: hidden;
	background: var(--surface-sunken);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
}

.tape--active {
	--frame-color: var(--accent);
}

.tape--result {
	--frame-w: 272px;
	--frame-h: 194px;
}

.card {
	position: absolute;
	top: 74px;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	box-sizing: border-box;
	width: 216px;
	height: 148px;
	padding: 16px;
	background: var(--surface-card);
	border: 1.5px solid var(--border-default);
	border-radius: var(--radius-lg);
}

.card--win {
	border: 2px solid var(--accent);
}

.card--ghost {
	background: transparent;
	border-style: dashed;
}

.card__hex {
	width: 12px;
	height: 13px;
	background: var(--border-default);
	clip-path: var(--hex-clip);
}

.card__text {
	display: -webkit-box;
	overflow: hidden;
	font: 700 var(--fs-18) / var(--lh-snug) var(--font-display);
	color: var(--text-strong);
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
}

.streak {
	position: absolute;
	height: 2px;
	background: var(--text-subtle);
	border-radius: 1px;
}

.frame {
	position: absolute;
	top: calc((296px - var(--frame-h)) / 2);
	left: calc(50% - var(--frame-w) / 2);
	box-sizing: border-box;
	width: var(--frame-w);
	height: var(--frame-h);
	pointer-events: none;
	border: 3px solid var(--frame-color);
	border-radius: var(--radius-xl);
	transition:
		opacity 200ms var(--ease-out),
		transform 320ms var(--ease-snap),
		width 240ms var(--ease-out),
		height 240ms var(--ease-out),
		top 240ms var(--ease-out),
		left 240ms var(--ease-out);
}

/* the entry is not decided while the tape moves, so the frame shows up only when the winner snaps in */
.tape--moving .frame {
	opacity: 0;
	transform: scale(1.18);
}

.tape--result .frame {
	box-shadow: var(--shadow-3);
}

.mark {
	position: absolute;
	left: calc(50% - 9px);
	width: 18px;
	height: 10px;
	background: var(--frame-color);
	transition: top 240ms var(--ease-out);
}

.mark--top {
	top: calc((296px - var(--frame-h)) / 2 - 14px);
	clip-path: polygon(0 0, 100% 0, 50% 100%);
}

.mark--bottom {
	top: calc((296px + var(--frame-h)) / 2 + 4px);
	clip-path: polygon(50% 0, 100% 100%, 0 100%);
}

.tape--busy .frame,
.tape--busy .mark {
	opacity: 0.5;
}

.empty {
	position: absolute;
	top: 126px;
	left: 50%;
	display: flex;
	align-items: center;
	height: 44px;
	padding: 0 24px;
	font: var(--type-h4);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	white-space: nowrap;
	color: var(--text-on-contrast);
	background: var(--surface-contrast);
	border-radius: var(--radius-sm);
	transform: translateX(-50%);
}
</style>
