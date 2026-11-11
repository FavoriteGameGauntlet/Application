<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { GameHistoryEntry } from '../../../api-facade/contracts'
import FormDialog from '../../../components/FormDialog.vue'
import type { FormSection, FormValues } from '../../../components/formDialog'
import UiButton from '../../../components/ui/UiButton.vue'
import UiDialog from '../../../components/ui/UiDialog.vue'
import UiRating from '../../../components/ui/UiRating.vue'
import UiUserAvatar from '../../../components/ui/UiUserAvatar.vue'
import { useCompletedStore } from '../../../stores/completedStore'
import { useMembersStore } from '../../../stores/membersStore'
import { formatDuration, formatPeriod } from '../../../utils/format'

type Props = {
	game?: GameHistoryEntry
	/** whose game it is */
	login: string
	/** the game of the current user, so the review can be edited */
	own?: boolean
	startEditing?: boolean
}

const { game, login, own, startEditing } = defineProps<Props>()

const emit = defineEmits<{ close: [] }>()

const completedStore = useCompletedStore()
const membersStore = useMembersStore()

const editing = ref(false)

watch(
	() => game,
	() => {
		editing.value = !!game && !!startEditing
	},
)

/** «Твоя игра · 24 ч 10 м · 03.11 → 09.11» */
const subtitle = computed(() =>
	game
		? [
				own ? 'Твоя игра' : login,
				formatDuration(game.timeSpent),
				formatPeriod(game.startedDate, game.endedDate),
			].join(' · ')
		: '',
)

const sections: FormSection[] = [
	{
		fields: [
			{ key: 'rating', label: 'Оценка', type: 'rating', required: 'оценка' },
			{
				key: 'comment',
				label: 'Отзыв',
				type: 'area',
				placeholder: 'Что зашло, что нет…',
			},
		],
	},
]

/** 0 stays an empty string, so the form asks for the mark */
const initial = computed<FormValues>(() => ({
	rating: game?.rating ? String(game.rating) : '',
	comment: game?.reviewComment ?? '',
}))

/** back to the review it was opened on; opened straight in editing, there is none to go back to */
const cancelEdit = () => {
	if (startEditing) emit('close')
	else editing.value = false
}

const onSave = async (values: FormValues) => {
	const target = game

	if (!target) return

	emit('close')
	await completedStore.saveReview(target, {
		rating: Number(values.rating),
		reviewComment: (values.comment as string).trim(),
	})
}
</script>

<template>
	<FormDialog
		:open="!!game && editing"
		:title="game?.name ?? ''"
		:subtitle
		:sections
		:initial
		:width="480"
		@close="cancelEdit"
		@save="onSave"
	/>

	<UiDialog
		:open="!!game && !editing"
		:title="game?.name"
		:subtitle
		:width="480"
		@close="emit('close')"
	>
		<template #lead>
			<UiUserAvatar
				:name="login"
				:color="membersStore.colorOf(login)"
				:size="36"
			/>
		</template>

		<div v-if="game" class="view">
			<UiRating v-if="game.rating" :model-value="game.rating" readonly />
			<span v-else class="view__empty">Без оценки</span>

			<p class="view__review">
				{{ game.reviewComment || 'Отзыв не написан.' }}
			</p>
		</div>

		<template v-if="own" #footer>
			<UiButton variant="outline" icon="pencil" @click="editing = true"
				>Изменить</UiButton
			>
		</template>
	</UiDialog>
</template>

<style scoped>
.view {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.view__empty {
	font: 500 15px / 1.45 var(--font-display);
	color: var(--text-subtle);
}

.view__review {
	margin: 0;
	font: var(--type-body);
	color: var(--text-body);
	text-wrap: pretty;
}
</style>
