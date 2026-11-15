<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

type Props = {
	entries: string[]
	/** the index the tape rolls to; set while a spin is landing */
	target?: number
	/** the index of the shown result */
	winner?: number
	busy?: boolean
	/** the tape is still being filled: no cards and no empty text, only the frame */
	loading?: boolean
	emptyText: string
}

type Phase = 'idle' | 'spin' | 'hold' | 'settle' | 'result'

const {
	entries,
	target,
	winner,
	busy = false,
	loading = false,
	emptyText,
} = defineProps<Props>()

const emit = defineEmits<{ landed: [] }>()

const PITCH = 232
const SPIN_MS = 6200
const HOLD_MS = 700
const SETTLE_MS = 450
/**
 * The cards a spin passes, whatever the size of the group: the speed of the
 * tape follows the distance, and a card that moves more than half a pitch per
 * frame looks like it stands still or runs back.
 */
const REEL_CARDS = 20
/** the cards at each end of the reel that are the pool in its own order, so the tape starts and lands without a jump */
const REEL_EDGE = 5
/** the spin stops past the winner and snaps back into the frame */
const OVERSHOOT = 0.42
/** the slots of the cards around the centre; the tape is at most about 1140px wide, so a card is out of it from 3 pitches on */
const OFFSETS = [-3, -2, -1, 0, 1, 2, 3, 4]
/** a card farther from the centre than this, in pitches, is outside the tape and is not drawn */
const VISIBLE_CARDS = 3
const STREAK_WIDTHS = [180, 260, 140, 300, 200, 160]
const STREAK_TOPS = [52, 92, 138, 170, 214, 248]

const mod = (a: number, n: number) => ((a % n) + n) % n

const pos = ref(winner ?? 0)
const speed = ref(0)
const phase = ref<Phase>(winner === undefined ? 'idle' : 'result')

let frame = 0

/** the cards of the spin that is rolling; `land` is the place of the winner, the middle is random */
let reel: { first: number; land: number; to: number; filler: string[] } | null =
	null

const textAt = (i: number) => {
	const n = entries.length

	if (!n) return ''

	if (!reel || i <= reel.first + REEL_EDGE) return entries[mod(i, n)]

	if (i >= reel.land - REEL_EDGE)
		return entries[mod(reel.to + i - reel.land, n)]

	return reel.filler[i - reel.first]
}

const run = (to: number) => {
	const n = entries.length
	const start = pos.value
	const first = Math.floor(start)
	const land = first + REEL_CARDS
	const stop = land + OVERSHOOT
	const t0 = performance.now()

	// no two equal cards in a row: they would read as one card that stands still
	const filler: string[] = []
	let prev = mod(first, n)

	for (let j = 0; j <= REEL_CARDS; j++) {
		prev = n > 1 ? (prev + 1 + Math.floor(Math.random() * (n - 1))) % n : 0
		filler.push(entries[prev])
	}

	reel = { first, land, to, filler }
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
			// the cards around the winner are the pool in its own order, so the winner's index is its place
			reel = null
			pos.value = to
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

onBeforeUnmount(() => {
	cancelAnimationFrame(frame)
	reel = null
})

const empty = computed(() => !entries.length)
const result = computed(() => phase.value === 'result' && !empty.value)
const moving = computed(() => phase.value === 'spin' || phase.value === 'hold')

const cards = computed(() => {
	const base = Math.floor(pos.value)
	// a few steps and not a radius per frame: a card with the same blur is drawn once and then only moved
	const blur = speed.value > 6 ? 3 : speed.value > 2 ? 1 : 0

	return OFFSETS.map((k) => {
		const i = base + k
		const d = i - pos.value
		const x = d * PITCH
		const isWin = result.value && Math.abs(d) < 0.5
		const scale = isWin ? 1.16 : 1 + 0.1 * Math.max(0, 1 - Math.abs(d))
		const dimmed = result.value && !isWin ? 0.22 : 1

		return {
			key: k,
			text: textAt(i),
			win: isWin,
			style: {
				// the place is a transform, not `left`: the tape moves without a layout every frame
				transform: `translateX(${x}px) scale(${scale})`,
				opacity: dimmed * (busy ? 0.5 : 1),
				filter: blur ? `blur(${blur}px)` : 'none',
				...(Math.abs(d) > VISIBLE_CARDS && { display: 'none' }),
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
		<div v-if="!loading" class="stage">
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
		</div>

		<span class="frame"></span>
		<span class="mark mark--top"></span>
		<span class="mark mark--bottom"></span>

		<div v-if="empty && !loading" class="empty">{{ emptyText }}</div>
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

/* the edge fade lives here and not on the tape, so the tape keeps its background and border; the width of the window doesn't matter */
.stage {
	position: absolute;
	inset: 0;
	-webkit-mask-image: linear-gradient(
		to right,
		transparent,
		#000 18%,
		#000 82%,
		transparent
	);
	mask-image: linear-gradient(
		to right,
		transparent,
		#000 18%,
		#000 82%,
		transparent
	);
}

.card {
	position: absolute;
	top: 74px;
	left: calc(50% - 108px);
	will-change: transform;
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
