<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { GameHistoryEntry } from '../../../api-facade/contracts'
import UiBadge from '../../../components/ui/UiBadge.vue'
import UiButton from '../../../components/ui/UiButton.vue'
import { useCompletedStore } from '../../../stores/completedStore'
import { formatDuration, formatPeriod } from '../../../utils/format'
import ReviewDialog from './ReviewDialog.vue'

type Props = {
	/** whose games are shown */
	user: string
	/** the games of the current user, so they can be rated */
	mine?: boolean
}

const { user, mine } = defineProps<Props>()

const completedStore = useCompletedStore()

const statuses = {
	completed: { label: 'Пройдена', tone: 'success' },
	cancelled: { label: 'Отменена', tone: 'neutral' },
	rerolled: { label: 'Перекручена', tone: 'info' },
} as const

const reviewing = ref<{ game: GameHistoryEntry; editing: boolean }>()

const games = computed(() => completedStore.lists[user] ?? [])

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
	<div class="table">
		<div class="table__row table__row--head">
			<span>{{ mine ? 'Игра' : `Игра (${user})` }}</span>
			<span>Начало → конец</span>
			<span>Время</span>
			<span>Статус</span>
			<span>Оценка</span>
		</div>

		<div
			v-for="game in games"
			:key="game.gameId"
			class="table__row table__row--body"
		>
			<span class="table__name">{{ game.name }}</span>
			<span class="table__num">{{
				formatPeriod(game.startedDate, game.endedDate)
			}}</span>
			<span class="table__num">{{ formatDuration(game.timeSpent) }}</span>
			<span class="table__status">
				<UiBadge :tone="statuses[game.endState].tone">{{
					statuses[game.endState].label
				}}</UiBadge>
			</span>
			<span class="table__rating">
				<template v-if="game.rating">
					<span class="table__num">{{ game.rating }} / 10</span>
					<UiButton
						class="table__button"
						variant="outline"
						size="sm"
						@click="reviewing = { game, editing: false }"
					>
						Отзыв
					</UiButton>
				</template>
				<template v-else-if="mine">
					<span class="table__none">—</span>
					<UiButton
						class="table__button"
						variant="outline"
						size="sm"
						@click="reviewing = { game, editing: true }"
					>
						Оценить
					</UiButton>
				</template>
				<span v-else class="table__none">—</span>
			</span>
		</div>

		<div v-if="!games.length" class="table__empty">
			{{
				mine
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

.table__row {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 150px 110px 130px 190px;
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
	min-height: 44px;
	padding: 4px 16px;
	border-top: 1px solid var(--border-subtle);
}

.table__row--body:hover {
	background: var(--surface-sunken);
}

.table__name {
	font: 600 15px / 1.45 var(--font-body);
	color: var(--text-strong);
}

.table__num {
	font: 600 15px / 1.45 var(--font-display);
	font-variant-numeric: tabular-nums;
	color: var(--text-strong);
}

.table__status {
	display: flex;
}

.table__rating {
	display: grid;
	grid-template-columns: 64px auto;
	gap: 8px;
	align-items: center;
	justify-items: start;
}

.table__none {
	font: 600 15px / 1.45 var(--font-display);
	color: var(--text-subtle);
}

.table .table__button {
	width: 104px;
}

.table__empty {
	padding: 24px 16px;
	font: var(--type-body-sm);
	color: var(--text-muted);
	border-top: 1px solid var(--border-subtle);
}
</style>
