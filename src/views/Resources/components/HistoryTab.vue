<script setup lang="ts">
import { computed, reactive, ref, useTemplateRef, watch } from 'vue'
import type { JournalEntry, JournalSourceKind } from '../../../api-facade/contracts'
import { useClickOutside } from '../../../composables/useClickOutside'
import UiBadge from '../../../components/ui/UiBadge.vue'
import UiIcon from '../../../components/ui/UiIcon.vue'
import UiIconButton from '../../../components/ui/UiIconButton.vue'
import { useJournalStore } from '../../../stores/journalStore'
import { useMembersStore } from '../../../stores/membersStore'
import { useSessionStore } from '../../../stores/sessionStore'
import { useToastStore } from '../../../stores/toastStore'
import { formatMoment } from '../../../utils/format'

type FilterKey = 'player' | 'resource' | 'source' | 'period'

type Props = {
	/** player to filter by initially */
	player?: string
}

const { player } = defineProps<Props>()

const journalStore = useJournalStore()
const membersStore = useMembersStore()
const sessionStore = useSessionStore()
const toastStore = useToastStore()

const ALL = ''

const filters = reactive<Record<FilterKey, string>>({
	player: player ?? ALL,
	resource: ALL,
	source: ALL,
	period: 'week',
})

const openFilter = ref<FilterKey>()
const filtersPanel = useTemplateRef('filtersPanel')

useClickOutside(filtersPanel, () => (openFilter.value = undefined))

const specs = computed(() => [
	{
		key: 'player' as const,
		title: 'Игрок',
		options: [
			{ value: ALL, label: 'все' },
			...membersStore.players.map((p) => ({ value: p.login, label: p.login })),
			{ value: 'admin', label: 'админ' },
		],
	},
	{
		key: 'resource' as const,
		title: 'Ресурс',
		options: [
			{ value: ALL, label: 'все' },
			{ value: 'points:Золото', label: 'золото' },
			{ value: 'points:Репутация', label: 'репутация' },
			{ value: 'effect', label: 'эффекты' },
		],
	},
	{
		key: 'source' as const,
		title: 'Источник',
		options: [
			{ value: ALL, label: 'все' },
			{ value: 'item', label: 'предмет' },
			{ value: 'wheel', label: 'колесо' },
			{ value: 'exchange', label: 'обмен' },
			{ value: 'timer', label: 'таймер' },
			{ value: 'grant', label: 'грант' },
		],
	},
	{
		key: 'period' as const,
		title: 'Период',
		options: [
			{ value: 'today', label: 'сегодня' },
			{ value: 'week', label: 'неделя' },
		],
	},
])

const pills = computed(() =>
	specs.value.map((spec) => {
		const current = spec.options.find((o) => o.value === filters[spec.key])

		return {
			...spec,
			current: current?.label,
			active: spec.key !== 'period' && filters[spec.key] !== ALL,
		}
	}),
)

const entries = ref<JournalEntry[]>([])

watch(
	() => player,
	() => {
		filters.player = player ?? ALL
	},
)

watch(
	[filters, () => journalStore.revision],
	async () => {
		entries.value = await journalStore.fetch({
			player: filters.player || undefined,
			resource: filters.resource || undefined,
			source: (filters.source || undefined) as JournalSourceKind | undefined,
			period: filters.period as 'today' | 'week',
		})
	},
	{ immediate: true },
)

const pick = (key: FilterKey, value: string) => {
	filters[key] = value
	openFilter.value = undefined
}

const who = (login: string) => {
	if (login === 'admin') return 'админ'
	if (login === 'all') return 'все'

	return login
}

const onFix = () =>
	toastStore.show('Пока не нарисовано', 'Этого экрана ещё нет в макетах.', 'info')
</script>

<template>
	<div ref="filtersPanel" class="filters">
		<div v-for="pill in pills" :key="pill.key" class="filter">
			<div
				class="pill"
				:class="{ 'pill--active': pill.active }"
				@click="openFilter = openFilter === pill.key ? undefined : pill.key"
			>
				<span class="pill__key">{{ pill.title }}</span>
				<span class="pill__value">{{ pill.current }}</span>
				<UiIcon name="chevron-down" :size="16" />
			</div>

			<div v-if="openFilter === pill.key" class="options">
				<div
					v-for="option in pill.options"
					:key="option.value"
					class="option"
					:class="{ 'option--on': option.value === filters[pill.key] }"
					@click="pick(pill.key, option.value)"
				>
					{{ option.label }}
				</div>
			</div>
		</div>
	</div>

	<div class="table">
		<div class="table__row table__row--head">
			<span>Когда</span>
			<span>Кто и через что</span>
			<span>Изменения</span>
			<span></span>
		</div>

		<div v-for="entry in entries" :key="entry.id" class="table__row table__row--body">
			<span class="table__time">{{ formatMoment(entry.at) }}</span>
			<span class="table__who">
				<span class="table__actor">{{ who(entry.actor) }}</span>
				<span class="table__source">{{ entry.source.label }}</span>
				<UiBadge v-if="entry.manual" tone="info" dot>вручную</UiBadge>
			</span>
			<span class="table__changes">
				<UiBadge
					v-for="(change, i) in entry.changes"
					:key="i"
					:tone="change.player === sessionStore.login ? 'accent' : 'neutral'"
				>
					{{ who(change.player) }}: {{ change.text }}
				</UiBadge>
			</span>
			<span class="table__fix">
				<UiIconButton icon="pencil" size="sm" label="Исправить" @click="onFix" />
			</span>
		</div>

		<div v-if="!entries.length" class="table__empty">Под эти фильтры ничего нет.</div>
	</div>
</template>

<style scoped>
.filters {
	position: relative;
	z-index: 3;
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.filter {
	position: relative;
}

.pill {
	display: flex;
	align-items: center;
	gap: 6px;
	height: 32px;
	padding: 0 10px 0 14px;
	font: 500 13px / 1 var(--font-body);
	color: var(--text-body);
	background: var(--surface-card);
	border: var(--border-width) solid var(--border-default);
	border-radius: var(--radius-pill);
	cursor: pointer;
}

.pill:hover {
	background: var(--surface-sunken);
}

.pill--active {
	border-color: var(--border-strong);
}

.pill__key {
	color: var(--text-muted);
}

.pill__value {
	font-weight: 600;
	color: var(--text-strong);
}

.options {
	position: absolute;
	top: 38px;
	left: 0;
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 180px;
	padding: 4px;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-md);
	box-shadow: var(--shadow-3);
}

.option {
	display: flex;
	align-items: center;
	height: 36px;
	padding: 0 12px;
	font: var(--type-body-sm);
	color: var(--text-strong);
	border-radius: var(--radius-sm);
	cursor: pointer;
}

.option:hover,
.option--on {
	background: var(--surface-sunken);
}

.option--on {
	font-weight: 600;
}

.table {
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.table__row {
	display: grid;
	grid-template-columns: 120px minmax(0, 1fr) minmax(0, 1.5fr) 32px;
	gap: 16px;
	align-items: center;
}

.table__row--head {
	padding: 12px 16px;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
	background: var(--surface-sunken);
}

.table__row--body {
	padding: 6px 16px;
	font: var(--type-body-sm);
	border-top: 1px solid var(--border-subtle);
}

.table__row--body:hover {
	background: var(--surface-sunken);
}

.table__time {
	font: var(--type-caption);
	color: var(--text-muted);
}

.table__who {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.table__actor {
	font-weight: 600;
	color: var(--text-strong);
}

.table__source {
	color: var(--text-muted);
}

.table__changes {
	display: flex;
	flex-wrap: wrap;
	gap: 4px;
}

.table__fix {
	display: flex;
	justify-content: flex-end;
}

.table__empty {
	padding: 24px 16px;
	font: var(--type-body-sm);
	color: var(--text-muted);
	border-top: 1px solid var(--border-subtle);
}
</style>
