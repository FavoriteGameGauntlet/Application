<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type {
	GameEndState,
	GameHistoryEntry,
} from '../../../api-facade/contracts'
import ListBar from '../../../components/ListBar.vue'
import UiBadge from '../../../components/ui/UiBadge.vue'
import UiFilterSelect from '../../../components/ui/UiFilterSelect.vue'
import UiRowMenu, {
	type RowMenuItem,
} from '../../../components/ui/UiRowMenu.vue'
import { useCompletedStore } from '../../../stores/completedStore'
import { daysBetween, dayOf, formatShortDay } from '../../../utils/calendar'
import { formatDuration } from '../../../utils/format'
import { plural } from '../../../utils/plural'
import ReviewDialog from './ReviewDialog.vue'

type Props = {
	/** whose games are shown */
	user: string
	/** the games of the current user, so they can be rated */
	mine?: boolean
}

type StateFilter = GameEndState | 'all'

const { user, mine } = defineProps<Props>()

const completedStore = useCompletedStore()

const statuses = {
	completed: { label: 'Пройдена', tone: 'success' },
	cancelled: { label: 'Отменена', tone: 'neutral' },
	rerolled: { label: 'Перекручена', tone: 'info' },
} as const

const stateLabels: Record<StateFilter, string> = {
	all: 'все',
	completed: 'пройдены',
	cancelled: 'отменены',
	rerolled: 'перекручены',
}

const stateOptions = (Object.keys(stateLabels) as StateFilter[]).map(
	(value) => ({ value, label: stateLabels[value] }),
)

const query = ref('')
const state = ref<StateFilter>('all')

const reviewing = ref<{ game: GameHistoryEntry; editing: boolean }>()

const games = computed(() => completedStore.lists[user] ?? [])

const rows = computed(() => {
	const q = query.value.trim().toLowerCase()
	return games.value.filter(
		(g) =>
			(state.value === 'all' || g.endState === state.value) &&
			(!q || g.name.toLowerCase().includes(q)),
	)
})

const summary = computed(() => {
	const total = rows.value.reduce((sum, g) => sum + g.timeSpent, 0)
	const ratings = rows.value.flatMap((g) => (g.rating ? [g.rating] : []))
	const parts = [`Всего ${formatDuration(total)}`]

	if (ratings.length) {
		const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
		parts.push(
			`Средняя оценка ${average.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}`,
		)
	}

	return parts
})

const period = (g: GameHistoryEntry) => {
	const days = { start: dayOf(g.startedDate), end: dayOf(g.endedDate) }
	const length = daysBetween(days)

	return {
		dates: `${formatShortDay(days.start)} → ${formatShortDay(days.end)}`,
		length: length
			? `${length} ${plural(length, ['день', 'дня', 'дней'])}`
			: 'в тот же день',
	}
}

const menuOf = (game: GameHistoryEntry): RowMenuItem[] => {
	if (game.rating) {
		return [
			{
				label: 'Отзыв',
				icon: 'book-open',
				select: () => (reviewing.value = { game, editing: false }),
			},
		]
	}

	return mine
		? [
				{
					label: 'Оценить',
					icon: 'star',
					select: () => (reviewing.value = { game, editing: true }),
				},
			]
		: []
}

const lines = computed(() =>
	rows.value.map((game) => ({
		game,
		period: period(game),
		menu: menuOf(game),
	})),
)

watch(
	() => user,
	() => completedStore.load(user),
	{ immediate: true },
)

// the dialog shows the actual game even after it is saved
const reviewedGame = computed(() =>
	games.value.find((g) => g.gameId === reviewing.value?.game.gameId),
)
</script>

<template>
	<ListBar v-model:query="query">
		<UiFilterSelect
			:model-value="state"
			label="Состояние"
			:options="stateOptions"
			:active="state !== 'all'"
			@update:model-value="state = $event as StateFilter"
		/>
		<template v-if="rows.length">
			<UiBadge v-for="part in summary" :key="part">{{ part }}</UiBadge>
		</template>
		<!-- the player whose games are shown -->
		<slot />
	</ListBar>

	<div class="table" role="table" aria-label="Пройденные игры">
		<div class="row row--head" role="row">
			<span role="columnheader">{{ mine ? 'Игра' : `Игра (${user})` }}</span>
			<span role="columnheader">Период</span>
			<span role="columnheader">Время</span>
			<span role="columnheader">Статус</span>
			<span role="columnheader">Оценка</span>
		</div>

		<component
			:is="menu.length ? UiRowMenu : 'div'"
			v-for="{ game, period: days, menu } in lines"
			:key="game.gameId"
			class="row row--body"
			role="row"
			v-bind="menu.length ? { items: menu, label: 'Действия с игрой' } : {}"
		>
			<span class="cell" role="cell">
				<span class="name">{{ game.name }}</span>
				<span class="sub">{{
					game.reviewComment ? `«${game.reviewComment}»` : 'Отзыва пока нет'
				}}</span>
			</span>
			<span class="cell" role="cell">
				<span class="period">{{ days.dates }}</span>
				<span class="sub">{{ days.length }}</span>
			</span>
			<span class="num" role="cell">{{ formatDuration(game.timeSpent) }}</span>
			<span class="status" role="cell">
				<UiBadge :tone="statuses[game.endState].tone">{{
					statuses[game.endState].label
				}}</UiBadge>
			</span>
			<span class="rating" role="cell">
				<template v-if="game.rating">
					<span
						class="pips"
						role="img"
						:aria-label="`Оценка ${game.rating} из 10`"
					>
						<i
							v-for="i in 10"
							:key="i"
							class="pips__pip"
							:class="{ 'pips__pip--on': i <= game.rating }"
						></i>
					</span>
					<span class="num">{{ game.rating }}</span>
				</template>
				<span v-else class="none">—</span>
			</span>
		</component>

		<div v-if="!rows.length" class="empty">
			{{
				games.length
					? 'Ничего не нашлось.'
					: mine
						? 'Пока ничего не пройдено. Первая игра уже ждёт на главной.'
						: `${user} пока ничего не прошёл(а).`
			}}
		</div>
	</div>

	<ReviewDialog
		:game="reviewedGame"
		:login="user"
		:own="mine"
		:start-editing="reviewing?.editing"
		@close="reviewing = undefined"
	/>
</template>

<style scoped>
.table {
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

/* the right 60px stay free for the «⋯» of the row */
.row {
	display: grid;
	grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr) 92px 132px 156px;
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
	white-space: nowrap;
	background: var(--surface-sunken);
}

.row--body {
	min-height: 72px;
	border-top: 1px solid var(--border-subtle);
}

.row--body:hover {
	background: var(--surface-sunken);
}

.cell {
	display: flex;
	flex-direction: column;
	gap: 3px;
	min-width: 0;
}

.name {
	font: 600 15px / 1.35 var(--font-body);
	color: var(--text-strong);
}

.period {
	color: var(--text-strong);
}

.sub {
	overflow: hidden;
	font: var(--type-caption);
	color: var(--text-muted);
	text-overflow: ellipsis;
	white-space: nowrap;
}

.num {
	font: 500 14px / 1.2 var(--font-mono);
	font-variant-numeric: tabular-nums;
	color: var(--text-strong);
}

.status {
	display: flex;
}

.rating {
	display: flex;
	align-items: center;
	gap: 10px;
}

.pips {
	display: inline-flex;
	gap: 2px;
}

.pips__pip {
	display: block;
	width: 6px;
	height: 14px;
	border-radius: 2px;
	background: var(--border-default);
}

.pips__pip--on {
	background: var(--accent);
}

.none {
	color: var(--text-muted);
}

.empty {
	padding: 20px;
	color: var(--text-muted);
	border-top: 1px solid var(--border-subtle);
}
</style>
