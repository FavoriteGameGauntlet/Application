<script setup lang="ts">
import { computed, watch } from 'vue'
import type { PointType } from '../../../api-facade/contracts'
import UiRowMenu, {
	type RowMenuItem,
} from '../../../components/ui/UiRowMenu.vue'
import { useJournalStore } from '../../../stores/journalStore'
import { useManualStore } from '../../../stores/manualStore'
import { useResourcesStore } from '../../../stores/resourcesStore'
import { useSessionStore } from '../../../stores/sessionStore'
import { formatBounds } from '../../../utils/format'
import { plural } from '../../../utils/plural'

const resourcesStore = useResourcesStore()
const sessionStore = useSessionStore()
const journalStore = useJournalStore()
const manualStore = useManualStore()

const formatValue = (n: number) =>
	`${n < 0 ? '−' : ''}${Math.abs(n).toLocaleString('ru-RU')}`

/** a bar needs both ends; an open side is written out as text */
const meterOf = (type: PointType, value: number) => {
	const { minimum, maximum } = type
	if (minimum === null || maximum === null || maximum <= minimum) {
		return undefined
	}

	const share = Math.min(
		Math.max((value - minimum) / (maximum - minimum), 0),
		1,
	)

	return {
		width: `${share * 100}%`,
		minimum: formatValue(minimum),
		maximum: formatValue(maximum),
		label: `${formatValue(value)} в диапазоне от ${formatValue(minimum)} до ${formatValue(maximum)}`,
	}
}

const rows = computed(() =>
	resourcesStore.sharedTypes.map((type) => {
		const value = resourcesStore.sharedPoints[type.id] ?? 0

		return {
			type,
			value: formatValue(value),
			unit: plural(value, [
				type.unitForms.one,
				type.unitForms.several,
				type.unitForms.many,
			]),
			meter: meterOf(type, value),
			bounds: formatBounds(type.minimum, type.maximum),
		}
	}),
)

const menu = computed<RowMenuItem[]>(() =>
	sessionStore.isAdmin
		? [
				{
					label: 'Ручное изменение',
					icon: 'pencil',
					select: () => manualStore.startFree(),
				},
			]
		: [],
)

watch(
	() => journalStore.revision,
	() => resourcesStore.loadSharedPoints(),
	{
		immediate: true,
	},
)
</script>

<template>
	<div class="table" role="table" aria-label="Общие очки пати">
		<div class="row row--head" role="row">
			<span role="columnheader">Тип</span>
			<span role="columnheader">Где значение между границами</span>
			<span role="columnheader" class="right">Сейчас</span>
		</div>

		<UiRowMenu
			v-for="row in rows"
			:key="row.type.id"
			class="row row--body"
			role="row"
			:label="
				sessionStore.isAdmin
					? 'Действия с общими очками'
					: 'Общие очки меняет админ ручной формой'
			"
			:items="menu"
			:disabled="!menu.length"
		>
			<span class="col" role="cell">
				<span class="name">{{ row.type.name }}</span>
				<span v-if="row.type.description" class="text">{{
					row.type.description
				}}</span>
			</span>

			<span v-if="row.meter" class="col col--meter" role="cell">
				<span class="meter" role="img" :aria-label="row.meter.label"
					><i class="meter__fill" :style="{ width: row.meter.width }"></i
				></span>
				<span class="ends">
					<span>{{ row.meter.minimum }}</span>
					<span>{{ row.meter.maximum }}</span>
				</span>
			</span>
			<span v-else class="bounds" role="cell">{{ row.bounds }}</span>

			<span class="col col--value" role="cell">
				<span class="value">{{ row.value }}</span>
				<span class="text">{{ row.unit }}</span>
			</span>
		</UiRowMenu>

		<div v-if="!rows.length" class="empty">В пати нет общих очков.</div>
	</div>
</template>

<style scoped>
.table {
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.row {
	display: grid;
	grid-template-columns: minmax(0, 1.5fr) minmax(0, 1.6fr) 110px;
	gap: 24px;
	align-items: center;
	box-sizing: border-box;
	padding: 12px 60px 12px 20px;
}

.row--head {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
	white-space: nowrap;
	background: var(--surface-sunken);
}

.row--body {
	min-height: 84px;
	border-top: 1px solid var(--border-subtle);
}

.right {
	text-align: right;
}

.col {
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
}

.col--meter {
	gap: 8px;
}

.col--value {
	align-items: flex-end;
}

.name {
	font: 600 15px / 1.35 var(--font-body);
	color: var(--text-strong);
}

.text {
	font: var(--type-caption);
	color: var(--text-muted);
}

.meter {
	display: block;
	height: 8px;
	overflow: hidden;
	background: var(--border-subtle);
	border-radius: 4px;
}

.meter__fill {
	display: block;
	height: 100%;
	background: var(--accent);
	border-radius: 4px;
}

.ends {
	display: flex;
	justify-content: space-between;
	font: 500 13px / 1 var(--font-mono);
	font-variant-numeric: tabular-nums;
	color: var(--text-muted);
}

.bounds {
	font: var(--type-body-sm);
	color: var(--text-muted);
}

.value {
	font: 600 20px / 1 var(--font-mono);
	font-variant-numeric: tabular-nums;
	color: var(--text-strong);
}

.empty {
	padding: 20px;
	color: var(--text-muted);
	border-top: 1px solid var(--border-subtle);
}
</style>
