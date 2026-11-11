<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import {
	PERIOD_PRESETS,
	compareDays,
	countDays,
	dayNumber,
	formatDay,
	formatMonth,
	joinPeriod,
	monthWeeks,
	shiftMonth,
	splitPeriod,
	today,
	type Day,
} from '../../utils/calendar'
import { plural } from '../../utils/plural'
import UiIcon from './UiIcon.vue'
import UiPopover from './UiPopover.vue'

type Props = {
	label?: string
	hint?: string
}

const { label } = defineProps<Props>()

/** «2026-11-01/2026-11-30» */
const model = defineModel<string>({ default: '' })

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const period = computed(
	() =>
		splitPeriod(model.value) ?? {
			start: today(),
			end: PERIOD_PRESETS[0].end(today()),
		},
)

const days = computed(() => countDays(period.value))

const daysText = computed(
	() => `${days.value} ${plural(days.value, ['день', 'дня', 'дней'])}`,
)

const set = (start: Day, end: Day) => {
	model.value = joinPeriod({ start, end })
}

/** the end the field is picking, undefined while the calendar is closed */
const picking = ref<'start' | 'end'>()
const month = ref(today())

const startButton = useTemplateRef<HTMLElement>('startButton')
const endButton = useTemplateRef<HTMLElement>('endButton')

const anchor = computed(() =>
	picking.value === 'end' ? endButton.value : startButton.value,
)

const toggle = (end: 'start' | 'end') => {
	if (picking.value === end) {
		picking.value = undefined

		return
	}

	picking.value = end
	month.value = shiftMonth(period.value[end], 0)
}

const weeks = computed(() => monthWeeks(month.value))

/** an end cannot come before the start */
const isOff = (day: Day) =>
	picking.value === 'end' && compareDays(day, period.value.start) < 0

const pick = (day: Day) => {
	if (isOff(day)) return

	const { start, end } = period.value

	if (picking.value === 'start') {
		set(day, compareDays(day, end) > 0 ? day : end)
	} else {
		set(start, day)
	}

	picking.value = undefined
}

const cellClass = (day: Day) => {
	const { start, end } = period.value

	return {
		'date-range__day--start': day === start,
		'date-range__day--end': day === end,
		'date-range__day--in':
			compareDays(day, start) > 0 && compareDays(day, end) < 0,
		'date-range__day--off': isOff(day),
	}
}

const isPreset = (end: (start: Day) => Day) =>
	end(period.value.start) === period.value.end
</script>

<template>
	<div class="date-range" role="group" :aria-label="label">
		<div class="date-range__head">
			<span class="date-range__label">{{ label }}</span>
			<span class="date-range__count">{{ daysText }}</span>
		</div>

		<div class="date-range__fields">
			<button
				ref="startButton"
				class="date-range__field"
				:class="{ 'date-range__field--on': picking === 'start' }"
				type="button"
				aria-haspopup="dialog"
				aria-label="Начало"
				@click="toggle('start')"
			>
				{{ formatDay(period.start) }}
			</button>

			<span class="date-range__dash" aria-hidden="true">—</span>

			<button
				ref="endButton"
				class="date-range__field"
				:class="{ 'date-range__field--on': picking === 'end' }"
				type="button"
				aria-haspopup="dialog"
				aria-label="Конец"
				@click="toggle('end')"
			>
				{{ formatDay(period.end) }}
			</button>
		</div>

		<div
			class="date-range__presets"
			role="radiogroup"
			aria-label="Быстрый выбор"
		>
			<button
				v-for="preset in PERIOD_PRESETS"
				:key="preset.key"
				class="date-range__preset"
				:class="{
					'date-range__preset--on': isPreset(preset.end),
				}"
				type="button"
				role="radio"
				:aria-checked="isPreset(preset.end)"
				@click="set(period.start, preset.end(period.start))"
			>
				{{ preset.label }}
			</button>
		</div>

		<span v-if="hint" class="date-range__hint">{{ hint }}</span>

		<UiPopover
			:open="picking !== undefined"
			:anchor
			:min-width="300"
			@close="picking = undefined"
		>
			<div class="date-range__calendar">
				<div class="date-range__nav">
					<button
						class="date-range__step"
						type="button"
						aria-label="Прошлый месяц"
						@click="month = shiftMonth(month, -1)"
					>
						<!-- there is no left chevron among the icons -->
						<UiIcon
							name="chevron-right"
							:size="18"
							style="transform: scaleX(-1)"
						/>
					</button>
					<span class="date-range__month">{{ formatMonth(month) }}</span>
					<button
						class="date-range__step"
						type="button"
						aria-label="Следующий месяц"
						@click="month = shiftMonth(month, 1)"
					>
						<UiIcon name="chevron-right" :size="18" />
					</button>
				</div>

				<div class="date-range__grid">
					<span v-for="d in WEEKDAYS" :key="d" class="date-range__weekday">{{
						d
					}}</span>
					<template v-for="(week, i) in weeks" :key="i">
						<template v-for="(day, j) in week" :key="j">
							<span v-if="!day"></span>
							<button
								v-else
								class="date-range__day"
								:class="cellClass(day)"
								type="button"
								:disabled="isOff(day)"
								@click="pick(day)"
							>
								{{ dayNumber(day) }}
							</button>
						</template>
					</template>
				</div>
			</div>
		</UiPopover>
	</div>
</template>

<style scoped>
.date-range {
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-width: 0;
}

.date-range__head {
	display: flex;
	align-items: center;
	gap: 10px;
	min-height: 24px;
}

.date-range__label {
	font: 700 12px / 1 var(--font-display);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.date-range__count {
	margin-left: auto;
	font: 500 13px / 1 var(--font-mono);
	color: var(--text-muted);
}

.date-range__fields {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 20px minmax(0, 1fr);
	align-items: center;
	gap: 8px;
}

.date-range__field {
	display: flex;
	align-items: center;
	gap: 8px;
	height: 44px;
	padding: 0 14px;
	text-align: left;
	font: var(--type-body);
	color: var(--text-strong);
	background: var(--surface-card);
	border: var(--border-width) solid var(--border-default);
	border-radius: var(--radius-sm);
	cursor: pointer;
}

.date-range__field--on {
	border-color: var(--border-strong);
	box-shadow: var(--shadow-focus);
}

.date-range__dash {
	text-align: center;
	color: var(--text-muted);
}

.date-range__presets {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.date-range__preset {
	height: 30px;
	padding: 0 12px;
	font: 500 14px / 1 var(--font-body);
	color: var(--text-strong);
	background: var(--surface-sunken);
	border-radius: var(--radius-pill);
	cursor: pointer;
}

.date-range__preset--on {
	background: var(--accent-soft);
	box-shadow: inset 0 0 0 1.5px var(--accent);
}

.date-range__hint {
	font: var(--type-caption);
	color: var(--text-muted);
}

.date-range__calendar {
	padding: 6px;
}

.date-range__nav {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-bottom: 4px;
}

.date-range__step {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	color: var(--text-muted);
	border-radius: var(--radius-sm);
	cursor: pointer;
}

.date-range__month {
	font: 700 13px / 1 var(--font-display);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-strong);
}

.date-range__grid {
	display: grid;
	grid-template-columns: repeat(7, 36px);
	gap: 2px 0;
	justify-content: center;
	text-align: center;
}

.date-range__weekday {
	padding: 6px 0;
	font: 700 11px / 1 var(--font-display);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.date-range__day {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 34px;
	font: 500 14px / 1 var(--font-mono);
	color: var(--text-strong);
	cursor: pointer;
}

.date-range__day--in {
	background: var(--accent-soft);
}

.date-range__day--start,
.date-range__day--end {
	font-weight: 700;
	color: var(--text-on-accent);
	background: var(--accent);
}

.date-range__day--start {
	border-radius: 6px 0 0 6px;
}

.date-range__day--end {
	border-radius: 0 6px 6px 0;
}

.date-range__day--start.date-range__day--end {
	border-radius: 6px;
}

.date-range__day--off {
	color: var(--text-subtle);
	cursor: default;
}
</style>
