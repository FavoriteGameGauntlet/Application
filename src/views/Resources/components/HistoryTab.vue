<script setup lang="ts">
import { Temporal } from '@js-temporal/polyfill'
import { computed, reactive, ref, useTemplateRef, watch } from 'vue'
import type {
	JournalEntry,
	JournalQuery,
	ResourceRef,
} from '../../../api-facade/contracts'
import UiFilterSelect from '../../../components/ui/UiFilterSelect.vue'
import UiRowMenu from '../../../components/ui/UiRowMenu.vue'
import UiUserAvatar from '../../../components/ui/UiUserAvatar.vue'
import { useJournalStore } from '../../../stores/journalStore'
import { useManualStore } from '../../../stores/manualStore'
import { useMembersStore } from '../../../stores/membersStore'
import { useResourcesStore } from '../../../stores/resourcesStore'
import {
	dayOf,
	formatDay,
	formatShortDay,
	timeOf,
	today,
} from '../../../utils/calendar'
import JournalSourceLabel from '../../../components/JournalSourceLabel.vue'
import { journalSourceGroups } from '../../../utils/journalSource'
import { plural } from '../../../utils/plural'

type FilterKey = 'user' | 'resource' | 'source' | 'period'

type Props = {
	/** user to filter by initially */
	user?: string
}

const { user } = defineProps<Props>()

const journalStore = useJournalStore()
const membersStore = useMembersStore()
const resourcesStore = useResourcesStore()
const manualStore = useManualStore()

const ALL = ''

/** the last day or week counted from the current moment */
const PERIOD_MS: Record<string, number> = {
	day: 24 * 3_600_000,
	week: 7 * 24 * 3_600_000,
}

const filters = reactive<Record<FilterKey, string>>({
	user: user ?? ALL,
	resource: ALL,
	source: ALL,
	period: 'week',
})

const specs = computed(() => [
	{
		key: 'user' as const,
		title: 'Игрок',
		options: [
			{ value: ALL, label: 'все' },
			...membersStore.users.map((p) => ({ value: p.login, label: p.login })),
		],
	},
	{
		key: 'resource' as const,
		title: 'Ресурс',
		options: [
			{ value: ALL, label: 'все' },
			...resourcesStore.pointTypes.map((type) => ({
				value: `points:${type.id}`,
				label: type.name.toLowerCase(),
			})),
			{ value: 'effect', label: 'эффекты' },
		],
	},
	{
		key: 'source' as const,
		title: 'Источник',
		options: [
			{ value: ALL, label: 'все' },
			...journalSourceGroups.map(({ value, label }) => ({ value, label })),
		],
	},
	{
		key: 'period' as const,
		title: 'Период',
		options: [
			{ value: 'day', label: 'за день' },
			{ value: 'week', label: 'за неделю' },
		],
	},
])

const entries = ref<JournalEntry[]>([])

/** 'points:<id>' or 'effect' → the resource filter of the query */
const toResource = (value: string): JournalQuery['resource'] => {
	if (!value) return undefined

	const [kind, id] = value.split(':')

	return { kind: kind as ResourceRef['kind'], id: id ? Number(id) : undefined }
}

watch(
	() => user,
	() => {
		filters.user = user ?? ALL
	},
)

watch(
	[filters, () => journalStore.revision],
	async () => {
		entries.value = await journalStore.fetch({
			user: filters.user || undefined,
			resource: toResource(filters.resource),
			sourceEventKinds: journalSourceGroups.find(
				(g) => g.value === filters.source,
			)?.kinds,
			from: new Date(Date.now() - PERIOD_MS[filters.period]).toISOString(),
		})
	},
	{ immediate: true },
)

const countText = computed(() => {
	const n = entries.value.length
	const period = specs.value[3].options.find(
		(o) => o.value === filters.period,
	)?.label

	return `${n} ${plural(n, ['запись', 'записи', 'записей'])} ${period}`
})

const dayTitle = (day: string) => {
	const now = Temporal.PlainDate.from(today())

	if (day === now.toString()) return 'Сегодня'
	if (day === now.subtract({ days: 1 }).toString()) return 'Вчера'

	return formatDay(day)
}

/** «+3 билета» is green, «−100 золота» red, the rest stays neutral */
const toneOf = (text: string) =>
	text.startsWith('+') ? 'plus' : text.startsWith('−') ? 'minus' : undefined

/** the corrected entry is outside the period when it is not in the list */
const fixOf = ({ correctsEntryId }: JournalEntry) => {
	if (correctsEntryId === undefined) return undefined

	const target = entries.value.find((e) => e.id === correctsEntryId)

	return target
		? {
				id: target.id,
				text: `Исправляет запись от ${formatShortDay(dayOf(target.at))}, ${timeOf(target.at)}`,
			}
		: { text: 'Исправляет более раннюю запись' }
}

const days = computed(() => {
	const result: {
		day: string
		title: string
		rows: ReturnType<typeof rowOf>[]
	}[] = []

	for (const entry of entries.value) {
		const day = dayOf(entry.at)
		let group = result.at(-1)

		if (group?.day !== day) {
			group = { day, title: dayTitle(day), rows: [] }
			result.push(group)
		}

		group.rows.push(rowOf(entry))
	}

	return result
})

function rowOf(entry: JournalEntry) {
	return {
		entry,
		time: timeOf(entry.at),
		fix: fixOf(entry),
		changes: entry.changes.map((c) => ({ ...c, tone: toneOf(c.text) })),
		menu: [
			{
				label: 'Исправить',
				icon: 'pencil',
				select: () => manualStore.startFix(entry),
			},
		],
	}
}

const table = useTemplateRef<HTMLElement>('table')
const highlighted = ref<number>()

let unhighlight: ReturnType<typeof setTimeout> | undefined

function showEntry(id: number) {
	table.value
		?.querySelector(`[data-entry="${id}"]`)
		?.scrollIntoView({ behavior: 'smooth', block: 'center' })

	highlighted.value = id
	clearTimeout(unhighlight)
	unhighlight = setTimeout(() => (highlighted.value = undefined), 2000)
}
</script>

<template>
	<div class="bar">
		<UiFilterSelect
			v-for="spec in specs"
			:key="spec.key"
			v-model="filters[spec.key]"
			:label="spec.title"
			:options="spec.options"
			:active="filters[spec.key] !== ALL"
		/>
		<span class="bar__count">{{ countText }}</span>
	</div>

	<div ref="table" class="table" role="table" aria-label="Журнал">
		<div class="row row--head" role="row">
			<span role="columnheader">Время</span>
			<span role="columnheader">Кто и через что</span>
			<span role="columnheader">Изменения</span>
		</div>

		<template v-for="group in days" :key="group.day">
			<div class="day" role="row">
				<span role="columnheader">{{ group.title }}</span>
				<span class="day__count">{{ group.rows.length }}</span>
			</div>

			<UiRowMenu
				v-for="row in group.rows"
				:key="row.entry.id"
				class="row row--body"
				:class="{ 'row--on': highlighted === row.entry.id }"
				role="row"
				:data-entry="row.entry.id"
				label="Действия с записью"
				:items="row.menu"
			>
				<span class="time" role="cell">{{ row.time }}</span>

				<span class="col" role="cell">
					<span class="who">
						<UiUserAvatar
							:name="row.entry.actor"
							:color="membersStore.colorOf(row.entry.actor)"
							:size="24"
						/>
						<span class="who__login">{{ row.entry.actor }}</span>
					</span>
					<JournalSourceLabel
						:source="row.entry.source"
						:corrects-entry-id="row.entry.correctsEntryId"
					/>
					<button
						v-if="row.fix?.id !== undefined"
						class="fix fix--link"
						type="button"
						@click="showEntry(row.fix.id)"
					>
						{{ row.fix.text }}
					</button>
					<span v-else-if="row.fix" class="fix">{{ row.fix.text }}</span>
				</span>

				<span class="changes" role="cell">
					<span
						v-for="(change, i) in row.changes"
						:key="i"
						class="change"
						:class="change.tone && `change--${change.tone}`"
					>
						<span v-if="change.login" class="change__who">{{
							change.login
						}}</span>
						{{ change.text }}
					</span>
				</span>
			</UiRowMenu>
		</template>

		<div v-if="!entries.length" class="empty">Под эти фильтры ничего нет.</div>
	</div>
</template>

<style scoped>
.bar {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	align-items: center;
}

.bar__count {
	margin-left: auto;
	font: var(--type-caption);
	color: var(--text-muted);
}

.table {
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.row {
	display: grid;
	grid-template-columns: 56px minmax(0, 1.05fr) minmax(0, 1.7fr);
	gap: 16px;
	align-items: center;
	box-sizing: border-box;
	padding: 12px 60px 12px 20px;
}

.row--head {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
	background: var(--surface-sunken);
}

.row--body {
	min-height: 72px;
	border-top: 1px solid var(--border-subtle);
}

.row--body:hover,
.row--on {
	background: var(--surface-sunken);
}

.row--on::before {
	position: absolute;
	top: 16px;
	bottom: 16px;
	left: 0;
	width: 3px;
	content: '';
	background: var(--accent);
	border-radius: 2px;
}

.day {
	display: flex;
	gap: 12px;
	align-items: center;
	padding: 10px 20px;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
	background: var(--surface-sunken);
	border-top: 1px solid var(--border-subtle);
}

.day__count {
	font: 500 14px / 1.2 var(--font-mono);
	letter-spacing: 0;
}

.time {
	font: 500 14px / 1.2 var(--font-mono);
	font-variant-numeric: tabular-nums;
	color: var(--text-muted);
}

.col {
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
}

.who {
	display: flex;
	gap: 8px;
	align-items: center;
}

.who__login {
	font: 600 15px / 1.35 var(--font-body);
	color: var(--text-strong);
}

.fix {
	font: var(--type-caption);
	color: var(--text-muted);
}

.fix {
	padding: 0;
	text-align: left;
	color: var(--info-text);
	background: none;
	border: 0;
}

.fix--link {
	cursor: pointer;
}

.fix--link:hover {
	text-decoration: underline;
}

.changes {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.change {
	display: inline-flex;
	gap: 6px;
	align-items: center;
	height: 26px;
	padding: 0 10px;
	font: 500 12px / 1 var(--font-body);
	white-space: nowrap;
	color: var(--text-body);
	background: var(--surface-sunken);
	border-radius: var(--radius-pill);
}

.change--plus {
	color: var(--success-text);
	background: var(--success-soft);
}

.change--minus {
	color: var(--danger-text);
	background: var(--danger-soft);
}

.change__who {
	color: var(--text-muted);
}

.empty {
	padding: 20px;
	font: var(--type-body-sm);
	color: var(--text-muted);
	border-top: 1px solid var(--border-subtle);
}
</style>
