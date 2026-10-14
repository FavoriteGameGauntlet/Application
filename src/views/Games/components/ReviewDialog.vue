<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CompletedGame } from '../../../api-facade/contracts'
import UiButton from '../../../components/ui/UiButton.vue'
import UiDialog from '../../../components/ui/UiDialog.vue'
import UiField from '../../../components/ui/UiField.vue'
import UiPlayerAvatar from '../../../components/ui/UiPlayerAvatar.vue'
import UiSelect from '../../../components/ui/UiSelect.vue'
import { useCompletedStore } from '../../../stores/completedStore'
import { useMembersStore } from '../../../stores/membersStore'
import { useToastStore } from '../../../stores/toastStore'
import { formatDuration, formatPeriod } from '../../../utils/format'

type Props = {
	game?: CompletedGame
	/** whose game it is */
	login: string
	/** the game of the current user, so the review can be edited */
	own?: boolean
	startEditing?: boolean
}

const { game, startEditing } = defineProps<Props>()

const emit = defineEmits<{ close: [] }>()

const completedStore = useCompletedStore()
const membersStore = useMembersStore()
const toastStore = useToastStore()

const editing = ref(false)
const rating = ref('')
const draft = ref('')

const ratingOptions = [
	{ value: '', label: 'Выбери оценку' },
	...[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => ({
		value: String(n),
		label: `${n} / 10`,
	})),
]

const startEdit = () => {
	editing.value = true
	rating.value = game?.rating ? String(game.rating) : ''
	draft.value = game?.review ?? ''
}

watch(
	() => game,
	() => {
		editing.value = false

		if (game && startEditing) {
			startEdit()
		}
	},
)

const onSave = async () => {
	const target = game

	if (!target) return

	if (!rating.value) {
		toastStore.show('Поставь оценку', 'Без оценки отзыв не сохранится.', 'danger')
		return
	}

	emit('close')
	await completedStore.saveReview(target, {
		rating: Number(rating.value),
		review: draft.value.trim(),
	})
}
</script>

<template>
	<UiDialog :open="!!game" :title="game?.name" :width="480" @close="emit('close')">
		<div v-if="game && !editing" class="view">
			<div class="view__grid">
				<div class="view__cell">
					<span class="label">Игрок</span>
					<span class="view__value">
						<UiPlayerAvatar :name="login" :color="membersStore.colorOf(login)" :size="24" />
						{{ login }}
					</span>
				</div>
				<div class="view__cell">
					<span class="label">Оценка</span>
					<span class="view__value">
						{{ game.rating ? `${game.rating} / 10` : 'без оценки' }}
					</span>
				</div>
				<div class="view__cell">
					<span class="label">Время в игре</span>
					<span class="view__value">{{ formatDuration(game.playedSeconds) }}</span>
				</div>
				<div class="view__cell">
					<span class="label">Начало → конец</span>
					<span class="view__value">{{ formatPeriod(game.startedAt, game.endedAt) }}</span>
				</div>
			</div>

			<div class="view__cell">
				<span class="label">Отзыв</span>
				<span class="view__review">{{ game.review || 'Отзыв не написан.' }}</span>
			</div>

			<div v-if="own" class="actions">
				<UiButton variant="outline" icon="pencil" @click="startEdit">Изменить</UiButton>
			</div>
		</div>

		<div v-else-if="game" class="edit">
			<UiSelect v-model="rating" label="Оценка" :options="ratingOptions" />

			<UiField label="Отзыв">
				<textarea v-model="draft" class="edit__text" placeholder="Что зашло, что нет…" rows="5"></textarea>
			</UiField>

			<div class="actions">
				<UiButton variant="outline" @click="emit('close')">Отмена</UiButton>
				<UiButton icon="check" @click="onSave">Сохранить</UiButton>
			</div>
		</div>
	</UiDialog>
</template>

<style scoped>
.view,
.edit {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.edit {
	gap: 16px;
}

.view__grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16px;
	padding: 16px 0;
	border-top: 1px solid var(--border-subtle);
	border-bottom: 1px solid var(--border-subtle);
}

.view__cell {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.view__value {
	display: flex;
	align-items: center;
	gap: 8px;
	height: 24px;
	font: 600 15px / 1.45 var(--font-display);
	font-variant-numeric: tabular-nums;
	color: var(--text-strong);
}

.view__review {
	font: var(--type-body);
	color: var(--text-body);
	text-wrap: pretty;
}

.actions {
	display: flex;
	gap: 8px;
	justify-content: flex-end;
}

.edit__text {
	width: 100%;
	padding: 10px 14px;
	font: var(--type-body);
	color: var(--text-strong);
	resize: vertical;
	outline: 0;
	background: var(--surface-card);
	border: var(--border-width) solid var(--border-default);
	border-radius: var(--radius-sm);
}

.edit__text:focus {
	border-color: var(--border-strong);
	box-shadow: var(--shadow-focus);
}
</style>
