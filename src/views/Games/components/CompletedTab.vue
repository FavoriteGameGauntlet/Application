<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CompletedGame } from '../../../api-facade/contracts'
import UiBadge from '../../../components/ui/UiBadge.vue'
import UiButton from '../../../components/ui/UiButton.vue'
import { useCompletedStore } from '../../../stores/completedStore'
import { formatDuration, formatPeriod } from '../../../utils/format'
import ReviewDialog from './ReviewDialog.vue'

type Props = {
	/** whose games are shown */
	player: string
	/** the games of the current user, so they can be rated */
	mine?: boolean
}

const { player, mine } = defineProps<Props>()

const completedStore = useCompletedStore()

const statuses = {
	completed: { label: 'Пройдена', tone: 'success' },
	cancelled: { label: 'Отменена', tone: 'neutral' },
	rerolled: { label: 'Перекручена', tone: 'info' },
} as const

const reviewing = ref<{ game: CompletedGame; editing: boolean }>()

const games = computed(() => completedStore.lists[player] ?? [])

watch(
	() => player,
	() => completedStore.load(player),
	{ immediate: true },
)

// the dialog shows the actual game even after it is saved
const reviewedGame = computed(() =>
	games.value.find((g) => g.id === reviewing.value?.game.id),
)
</script>

<template>
	<div class="table">
		<div class="table__row table__row--head">
			<span>{{ mine ? 'Игра' : `Игра (${player})` }}</span>
			<span>Начало → конец</span>
			<span>Время</span>
			<span>Статус</span>
			<span>Оценка</span>
		</div>

		<div v-for="game in games" :key="game.id" class="table__row table__row--body">
			<span class="table__name">{{ game.name }}</span>
			<span class="table__num">{{ formatPeriod(game.startedAt, game.endedAt) }}</span>
			<span class="table__num">{{ formatDuration(game.playedSeconds) }}</span>
			<span class="table__status">
				<UiBadge :tone="statuses[game.status].tone">{{ statuses[game.status].label }}</UiBadge>
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
				<UiButton
					v-else-if="mine && game.status === 'completed'"
					class="table__button"
					variant="outline"
					size="sm"
					@click="reviewing = { game, editing: true }"
				>
					Оценить
				</UiButton>
				<span v-else class="table__none">—</span>
			</span>
		</div>

		<div v-if="!games.length" class="table__empty">
			{{
				mine
					? 'Пока ничего не пройдено. Первая игра уже ждёт на главной.'
					: `${player} пока ничего не прошёл(а).`
			}}
		</div>
	</div>

	<span v-if="mine" class="note">
		Оценку и отзыв видят все в пати. Свой отзыв можно поправить в любой момент.
	</span>

	<ReviewDialog
		:game="reviewedGame"
		:login="player"
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

.note {
	font: var(--type-body-sm);
	color: var(--text-muted);
}
</style>
