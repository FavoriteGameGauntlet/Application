<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue'
import { MEMBER_COLORS, MEMBER_COLOR_NAMES } from '../constants/memberColors'
import {
	hexToHsv,
	hsvToHex,
	isMemberColor,
	type Hsv,
} from '../utils/memberColor'
import UiInput from './ui/UiInput.vue'
import UiPopover from './ui/UiPopover.vue'
import UiUserAvatar from './ui/UiUserAvatar.vue'

type Props = {
	label: string
	hint?: string
	/** the avatar beside the hex field shows the color on this login */
	login?: string
	avatarUrl?: string | null
	/** the hex is wrong: the field turns red, the form names the problem */
	invalid?: boolean
}

const { label, hint, login, avatarUrl, invalid } = defineProps<Props>()

/** lowercase hex once valid; the form does not save an invalid one */
const color = defineModel<string>({ required: true })

/** the hex field keeps what the user types, the model gets it trimmed and lowercase */
const text = ref(color.value)

const isValid = computed(() => isMemberColor(color.value))

/** the swatch and the square keep the last valid color while the hex field holds a wrong one */
const hsv = ref<Hsv>(hexToHsv(isValid.value ? color.value : MEMBER_COLORS[0]))
const shown = computed(() => hsvToHex(hsv.value))

const isPalette = computed(() =>
	(MEMBER_COLORS as readonly string[]).includes(color.value),
)

watch(color, (value) => {
	if (value !== text.value.trim().toLowerCase()) text.value = value

	// the hue of a grey or black is lost in hex, so the square keeps its own
	if (isMemberColor(value) && value !== shown.value) hsv.value = hexToHsv(value)
})

const onType = (value: string) => {
	text.value = value
	color.value = value.trim().toLowerCase()
}

const setHsv = (next: Hsv) => {
	hsv.value = next
	color.value = hsvToHex(next)
}

const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value))

/** follows the pointer from the press to the release, also outside the element */
const drag = (event: PointerEvent, apply: (x: number, y: number) => void) => {
	const el = event.currentTarget as HTMLElement
	const move = (e: PointerEvent) => {
		const box = el.getBoundingClientRect()

		apply(
			clamp((e.clientX - box.left) / box.width, 1),
			clamp((e.clientY - box.top) / box.height, 1),
		)
	}

	// keeps the focus on the handle: a press on the track would move it to the body
	event.preventDefault()
	el.setPointerCapture(event.pointerId)
	el.querySelector<HTMLElement>('[role="slider"]')?.focus()
	move(event)
	el.onpointermove = move
	el.onpointerup = () => (el.onpointermove = null)
}

const onSquareDown = (event: PointerEvent) =>
	drag(event, (x, y) => setHsv({ ...hsv.value, s: x, v: 1 - y }))

const onHueDown = (event: PointerEvent) =>
	drag(event, (x) => setHsv({ ...hsv.value, h: x * 360 }))

/** the arrows move by 1%, with Shift by 10% */
const stepOf = (event: KeyboardEvent) => (event.shiftKey ? 0.1 : 0.01)

const onSquareKey = (event: KeyboardEvent) => {
	const step = stepOf(event)
	const { s, v } = hsv.value
	const moves: Record<string, Partial<Hsv>> = {
		ArrowLeft: { s: clamp(s - step, 1) },
		ArrowRight: { s: clamp(s + step, 1) },
		ArrowUp: { v: clamp(v + step, 1) },
		ArrowDown: { v: clamp(v - step, 1) },
	}

	if (!moves[event.key]) return

	// the popover walks its buttons with the up and down arrows
	event.preventDefault()
	event.stopPropagation()
	setHsv({ ...hsv.value, ...moves[event.key] })
}

const onHueKey = (event: KeyboardEvent) => {
	const delta = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[
		event.key
	]

	if (!delta) return

	event.preventDefault()
	event.stopPropagation()
	setHsv({
		...hsv.value,
		h: clamp(hsv.value.h + delta * stepOf(event) * 360, 360),
	})
}

const isPicking = ref(false)
/** the panel hangs under the swatch, so the hex field above it stays in sight */
const preview = useTemplateRef('preview')

const percent = (value: number) => `${Math.round(value * 100)}%`
</script>

<template>
	<div class="picker">
		<span class="picker__label">{{ label }}</span>

		<div class="picker__swatches">
			<button
				v-for="swatch in MEMBER_COLORS"
				:key="swatch"
				type="button"
				class="swatch"
				:class="{ 'swatch--on': swatch === color }"
				:style="{ background: swatch }"
				:aria-label="MEMBER_COLOR_NAMES[swatch]"
				:title="MEMBER_COLOR_NAMES[swatch]"
				:aria-pressed="swatch === color"
				@click="color = swatch"
			></button>

			<button
				type="button"
				class="swatch swatch--custom"
				:class="{ 'swatch--on': isValid && !isPalette }"
				:style="isValid && !isPalette ? { background: color } : undefined"
				aria-label="Свой цвет"
				title="Свой цвет"
				:aria-pressed="isValid && !isPalette"
				:aria-expanded="isPicking"
				@click="isPicking = true"
			></button>
		</div>

		<div class="picker__hex">
			<span ref="preview" class="picker__preview">
				<UiUserAvatar
					:name="login"
					:color="shown"
					:src="avatarUrl"
					:ring="!!avatarUrl"
					:size="40"
				/>
			</span>

			<div class="picker__input">
				<UiInput
					:model-value="text"
					placeholder="#ffb000"
					aria-label="Цвет в hex"
					:invalid
					:hint
					numeric
					@update:model-value="onType"
				/>
			</div>
		</div>

		<UiPopover
			:open="isPicking"
			:anchor="preview"
			:min-width="240"
			@close="isPicking = false"
		>
			<div class="picker__panel">
				<div
					class="square"
					:style="{ '--hue': `hsl(${hsv.h} 100% 50%)` }"
					@pointerdown="onSquareDown"
				>
					<button
						type="button"
						class="handle"
						:style="{
							left: percent(hsv.s),
							top: percent(1 - hsv.v),
							background: shown,
						}"
						role="slider"
						aria-label="Насыщенность и яркость"
						:aria-valuenow="Math.round(hsv.s * 100)"
						:aria-valuetext="`насыщенность ${percent(hsv.s)}, яркость ${percent(hsv.v)}`"
						@keydown="onSquareKey"
					></button>
				</div>

				<div class="hue" @pointerdown="onHueDown">
					<button
						type="button"
						class="handle"
						:style="{
							left: percent(hsv.h / 360),
							background: `hsl(${hsv.h} 100% 50%)`,
						}"
						role="slider"
						aria-label="Оттенок"
						aria-valuemin="0"
						aria-valuemax="360"
						:aria-valuenow="Math.round(hsv.h)"
						@keydown="onHueKey"
					></button>
				</div>
			</div>
		</UiPopover>
	</div>
</template>

<style scoped>
.picker {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.picker__label {
	font: 700 12px / 1 var(--font-display);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.picker__swatches {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
}

.swatch {
	width: 28px;
	height: 28px;
	padding: 0;
	border: 1px solid var(--border-subtle);
	border-radius: 50%;
	cursor: pointer;
}

.swatch--on {
	outline: 2px solid var(--text-strong);
	outline-offset: 2px;
}

/* any color: the hue circle until a custom one is picked */
.swatch--custom {
	background: conic-gradient(#f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
}

.picker__panel {
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 6px;
}

.square,
.hue {
	position: relative;
	touch-action: none;
	cursor: crosshair;
}

.square {
	aspect-ratio: 1;
	background:
		linear-gradient(to top, #000, transparent),
		linear-gradient(to right, #fff, var(--hue));
	border-radius: var(--radius-sm);
}

.hue {
	height: 12px;
	background: linear-gradient(
		to right,
		#f00,
		#ff0 17%,
		#0f0 33%,
		#0ff 50%,
		#00f 67%,
		#f0f 83%,
		#f00
	);
	border-radius: 6px;
}

.handle {
	position: absolute;
	width: 18px;
	height: 18px;
	padding: 0;
	border: 2px solid #fff;
	border-radius: 50%;
	box-shadow: 0 0 0 1px rgb(0 0 0 / 0.35);
	transform: translate(-50%, -50%);
	cursor: grab;
}

.hue .handle {
	top: 50%;
}

.handle:focus-visible {
	outline: none;
	box-shadow: var(--shadow-focus);
}

.picker__hex {
	display: flex;
	align-items: flex-start;
	gap: 10px;
}

.picker__preview {
	display: flex;
	flex: none;
}

.picker__input {
	flex: 1;
	min-width: 0;
}
</style>
