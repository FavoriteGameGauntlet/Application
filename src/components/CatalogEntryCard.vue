<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogEntry, ItemEntryRow } from '../api-facade/contracts'
import { formatSpan } from '../utils/format'
import { itemConditionLabels } from '../utils/itemCondition'
import { type CatalogView, changeTone } from './catalogTable'
import UiBadge from './ui/UiBadge.vue'
import UiIcon from './ui/UiIcon.vue'

type Props = {
	view: CatalogView
	entry: CatalogEntry
}

const { view, entry } = defineProps<Props>()

const GAUGE_SEGMENTS = 24

/** `texts[i]` is the text the facade built for `rows[i]` */
const toLines = (rows: ItemEntryRow[], texts: string[]) =>
	rows.map((row, i) => ({
		who: row.who === 'chosen' ? 'Цель' : 'Владелец',
		text: texts[i] ?? '',
		tone: row.kind === 'user-item-transfer' ? 'plain' : changeTone(row.amount),
	}))

const icon = computed(
	() =>
		({
			points: 'coins',
			shared: 'users',
			items: 'gift',
			perks: 'sparkles',
			effects: 'clock',
		})[view],
)

const kindLabel = computed(() => {
	switch (view) {
		case 'points':
			return 'Очки'
		case 'shared':
			return 'Общие очки'
		case 'items':
			return 'Предмет'
		case 'perks':
			return entry.perkKind === 'active' ? 'Активный перк' : 'Пассивный перк'
		case 'effects':
			return 'Эффект'
	}

	return ''
})

const isPoints = computed(() => view === 'points' || view === 'shared')

/** perks put the modifier texts before the ability texts in `changes` */
const modifiers = computed(() =>
	(entry.modifiers ?? []).map((m, i) => ({
		text: entry.changes?.[i] ?? '',
		tone: changeTone(m.amount),
	})),
)

const itemLines = computed(() =>
	toLines(entry.entries ?? [], entry.changes ?? []),
)

const ability = computed(() => entry.ability)

const abilityLines = computed(() =>
	ability.value
		? toLines(ability.value.entries, ability.value.changes ?? [])
		: [],
)

const formatValue = (value: number | null | undefined) =>
	value === null || value === undefined
		? 'Без лимита'
		: value.toLocaleString('ru-RU')

/** the start value as a mark between the bounds; only when both bounds are set */
const gauge = computed(() => {
	const { minimum, maximum, startValue = 0 } = entry

	if (
		minimum === null ||
		minimum === undefined ||
		maximum === null ||
		maximum === undefined ||
		maximum <= minimum
	)
		return undefined

	const mark = Math.round(
		((startValue - minimum) / (maximum - minimum)) * (GAUGE_SEGMENTS - 1),
	)

	return {
		label: `Старт ${startValue} в диапазоне от ${minimum} до ${maximum}`,
		segments: Array.from({ length: GAUGE_SEGMENTS }, (_, i) =>
			i < mark ? 'filled' : i === mark ? 'mark' : 'empty',
		),
	}
})

const units = computed(() => {
	const forms = entry.unitForms

	if (!forms) return []

	return [
		{ label: 'Для 1', form: forms.one, example: `+1 ${forms.one}` },
		{ label: 'Для 2–4', form: forms.several, example: `+3 ${forms.several}` },
		{ label: 'Для 5 и больше', form: forms.many, example: `−7 ${forms.many}` },
	]
})
</script>

<template>
	<div class="card">
		<div class="card__head">
			<span class="card__icon"><UiIcon :name="icon" :size="24" /></span>
			<div class="card__title">
				<span class="card__name">{{ entry.name }}</span>
				<div class="card__badges">
					<UiBadge :tone="entry.perkKind === 'active' ? 'info' : 'neutral'">{{
						kindLabel
					}}</UiBadge>
					<UiBadge v-if="isPoints && entry.isPublic === false">
						<UiIcon name="lock" :size="12" />Только админы
					</UiBadge>
					<UiBadge v-if="entry.deleted" tone="danger">Удалён</UiBadge>
				</div>
			</div>
		</div>

		<p v-if="entry.description" class="card__desc">{{ entry.description }}</p>
		<p v-else class="card__desc card__desc--empty">Без описания</p>

		<template v-if="view === 'items'">
			<section class="block">
				<span class="label">При использовании</span>
				<div v-for="(line, i) in itemLines" :key="i" class="line">
					<span class="label">{{ line.who }}</span>
					<span class="line__text" :class="`tone--${line.tone}`">{{
						line.text
					}}</span>
				</div>
				<span class="hint">
					<UiIcon
						:name="
							entry.shouldApplyToAll === false ? 'check-circle-2' : 'check'
						"
						:size="18"
					/>
					{{
						entry.shouldApplyToAll === false
							? 'Игрок сам отмечает, какие строки применить'
							: 'Все строки применяются сразу'
					}}
				</span>
			</section>

			<div class="stats">
				<div class="stat">
					<span class="stat__label">Использований</span>
					<span class="stat__num">×{{ entry.usesMax ?? 1 }}</span>
				</div>
			</div>

			<section class="block">
				<span class="label">Условия</span>
				<div
					v-for="condition in entry.conditions ?? []"
					:key="condition"
					class="rule"
				>
					<span class="rule__title">{{
						itemConditionLabels[condition].label
					}}</span>
					<span class="hint">{{ itemConditionLabels[condition].hint }}</span>
				</div>
				<span v-if="!entry.conditions?.length" class="hint">
					Без условий: предмет можно применить в любой момент.
				</span>
			</section>
		</template>

		<template v-if="view === 'perks' || view === 'effects'">
			<section class="block">
				<span class="label">{{
					view === 'perks' ? 'Пока перк у игрока' : 'Пока действует'
				}}</span>
				<div v-if="modifiers.length" class="pills">
					<span
						v-for="(m, i) in modifiers"
						:key="i"
						class="pill"
						:class="`pill--${m.tone}`"
						>{{ m.text }}</span
					>
				</div>
				<span v-else class="hint">Очки сам не меняет.</span>
			</section>
		</template>

		<template v-if="view === 'perks'">
			<section v-if="ability" class="block block--boxed">
				<span class="label">Способность: когда игрок применяет</span>
				<div v-for="(line, i) in abilityLines" :key="i" class="line">
					<span class="label">{{ line.who }}</span>
					<span class="line__text" :class="`tone--${line.tone}`">{{
						line.text
					}}</span>
				</div>
				<span class="hint">
					<UiIcon
						:name="ability.shouldApplyToAll ? 'check' : 'check-circle-2'"
						:size="18"
					/>
					{{
						ability.shouldApplyToAll
							? 'Все строки применяются сразу'
							: 'Игрок сам отмечает, какие строки применить'
					}}
				</span>
				<div class="stats">
					<div v-if="!ability.uses" class="stat">
						<span class="stat__label">Сколько раз</span>
						<span class="stat__text">Сколько угодно</span>
					</div>
					<template v-else>
						<div class="stat">
							<span class="stat__label">Максимум</span>
							<span class="stat__num">{{ ability.uses.max }}</span>
						</div>
						<div class="stat">
							<span class="stat__label">У нового владельца</span>
							<span class="stat__num">{{ ability.uses.start }}</span>
						</div>
						<div v-if="ability.chargesMax > 0" class="stat">
							<span class="stat__label">Зарядов на одно использование</span>
							<span class="stat__num">{{ ability.chargesMax }}</span>
						</div>
						<div v-if="ability.renewalPeriod" class="stat">
							<span class="stat__label">Полное восстановление раз в</span>
							<span class="stat__text">{{
								formatSpan(ability.renewalPeriod)
							}}</span>
						</div>
					</template>
				</div>
			</section>
			<span v-else class="hint">
				<UiIcon name="info" :size="18" />
				Пассивный перк работает сам, применять его не нужно.
			</span>
		</template>

		<div v-if="view === 'effects'" class="stats">
			<div class="stat">
				<span class="stat__label">Сколько действует</span>
				<span class="stat__text">{{
					entry.duration ? formatSpan(entry.duration) : 'Пока не снимут'
				}}</span>
			</div>
		</div>

		<template v-if="isPoints">
			<section class="block">
				<span class="label">Значения</span>
				<div v-if="gauge" class="gauge" role="img" :aria-label="gauge.label">
					<span
						v-for="(segment, i) in gauge.segments"
						:key="i"
						:class="`gauge__${segment}`"
					></span>
				</div>
				<div class="stats stats--3">
					<div class="stat">
						<span class="stat__label">Минимум</span>
						<span class="stat__num">{{ formatValue(entry.minimum) }}</span>
					</div>
					<div class="stat">
						<span class="stat__label">Старт</span>
						<span class="stat__num">{{ formatValue(entry.startValue) }}</span>
					</div>
					<div class="stat">
						<span class="stat__label">Максимум</span>
						<span class="stat__num">{{ formatValue(entry.maximum) }}</span>
					</div>
				</div>
			</section>

			<section class="block">
				<span class="label">Как писать в журнале</span>
				<div class="stats stats--3">
					<div v-for="unit in units" :key="unit.label" class="stat">
						<span class="stat__label">{{ unit.label }}</span>
						<span class="stat__form">{{ unit.form }}</span>
						<span class="stat__label">{{ unit.example }}</span>
					</div>
				</div>
			</section>

			<section class="block">
				<span class="label">Правила</span>
				<div class="rule rule--icon">
					<UiIcon
						:name="entry.isPublic === false ? 'lock' : 'users'"
						:size="18"
					/>
					{{
						entry.isPublic === false
							? 'Видят только админы'
							: 'Видят все игроки'
					}}
				</div>
				<div class="rule rule--icon">
					<UiIcon :name="view === 'shared' ? 'users' : 'user'" :size="18" />
					{{ view === 'shared' ? 'Общие на пати' : 'У каждого игрока свои' }}
				</div>
			</section>
		</template>
	</div>
</template>

<style scoped>
.card {
	display: flex;
	flex-direction: column;
	gap: 22px;
	padding: 24px;
}

.card__head {
	display: flex;
	align-items: center;
	gap: 14px;
}

.card__icon {
	display: flex;
	flex: none;
	align-items: center;
	justify-content: center;
	width: 52px;
	height: 60px;
	color: var(--accent);
	background: var(--surface-sunken);
	clip-path: var(--hex-clip);
}

.card__title {
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-width: 0;
}

.card__name {
	font: 700 22px / 1.2 var(--font-body);
	color: var(--text-strong);
	text-wrap: balance;
}

.card__badges {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.card__desc {
	margin: 0;
	font: var(--type-body);
	color: var(--text-body);
	text-wrap: pretty;
}

.card__desc--empty {
	font-style: italic;
	color: var(--text-muted);
}

.block {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.block--boxed {
	gap: 14px;
	padding: 16px;
	border: var(--border-width) solid var(--border-default);
	border-radius: var(--radius-md);
}

.label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.line {
	display: grid;
	grid-template-columns: 92px minmax(0, 1fr);
	gap: 12px;
	align-items: center;
	padding: 10px 14px;
	background: var(--surface-sunken);
	border-radius: var(--radius-sm);
}

.line__text {
	font: 600 15px / 1.3 var(--font-body);
}

.tone--plus {
	color: var(--success-text);
}

.tone--minus {
	color: var(--danger-text);
}

.tone--plain {
	color: var(--text-strong);
}

.hint {
	display: flex;
	align-items: center;
	gap: 10px;
	font: var(--type-caption);
	color: var(--text-muted);
}

.rule {
	display: flex;
	flex-direction: column;
	gap: 2px;
	padding: 10px 0;
	border-top: 1px solid var(--border-subtle);
}

.rule--icon {
	flex-direction: row;
	align-items: center;
	gap: 12px;
	font-weight: 600;
	color: var(--text-strong);
}

.rule__title {
	font: 600 14px / 1.3 var(--font-body);
	color: var(--text-strong);
}

.pills {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.pill {
	display: inline-flex;
	align-items: center;
	height: 30px;
	padding: 0 12px;
	font: 500 13px / 1 var(--font-body);
	border-radius: var(--radius-pill);
}

.pill--plus {
	color: var(--success-text);
	background: var(--success-soft);
}

.pill--minus {
	color: var(--danger-text);
	background: var(--danger-soft);
}

.pill--plain {
	color: var(--text-body);
	background: var(--surface-sunken);
}

.stats {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 10px;
}

.stats--3 {
	grid-template-columns: repeat(3, minmax(0, 1fr));
}

.stat {
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
	padding: 12px 14px;
	background: var(--surface-sunken);
	border-radius: var(--radius-md);
}

.stat__label {
	font: var(--type-caption);
	color: var(--text-muted);
}

.stat__num {
	font: 500 20px / 1.2 var(--font-mono);
	font-variant-numeric: tabular-nums;
	color: var(--text-strong);
}

.stat__text {
	font: 600 18px / 1.25 var(--font-body);
	color: var(--text-strong);
}

.stat__form {
	font: 600 16px / 1.25 var(--font-body);
	color: var(--text-strong);
}

.gauge {
	display: flex;
	align-items: center;
	gap: 3px;
	padding: 4px 0;
}

.gauge__filled,
.gauge__empty {
	flex: 1;
	height: 14px;
	border-radius: 3px;
}

.gauge__filled {
	background: var(--accent);
}

.gauge__empty {
	background: var(--border-subtle);
}

.gauge__mark {
	flex: none;
	width: 4px;
	height: 24px;
	border-radius: 2px;
	background: var(--text-strong);
}
</style>
