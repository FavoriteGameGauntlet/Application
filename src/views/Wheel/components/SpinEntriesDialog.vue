<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ApplyMode, ResourceRef } from '../../../api-facade/contracts'
import UiButton from '../../../components/ui/UiButton.vue'
import UiDialog from '../../../components/ui/UiDialog.vue'
import UiPickList from '../../../components/ui/UiPickList.vue'
import { isPickComplete, pickLimit } from '../../../utils/applyMode'

type Props = {
	/** the entries of the item that fell; set while the dialog is open */
	entries: ResourceRef[] | null
	/** how many of the entries the user picks */
	applyMode?: ApplyMode
}

const { entries, applyMode } = defineProps<Props>()

const emit = defineEmits<{ close: []; confirm: [entryIds: number[]] }>()

const picked = ref<string[]>([])

const pickedIds = computed(() => picked.value.map(Number))

const canConfirm = computed(() => isPickComplete(applyMode, pickedIds.value))

const options = computed(() =>
	(entries ?? []).map((entry) => ({
		value: String(entry.entryId),
		label: entry.text ?? entry.name,
	})),
)

watch(
	() => entries,
	() => {
		picked.value = []
	},
)
</script>

<template>
	<UiDialog
		:open="!!entries"
		title="Что применить"
		:width="460"
		@close="emit('close')"
	>
		<div class="dialog">
			<div class="dialog__block">
				<span class="label">{{
					applyMode === 'one'
						? 'Выбери изменение, которое сработает'
						: 'Отметь изменения, которые сработают'
				}}</span>

				<UiPickList
					v-model="picked"
					:options="options"
					:limit="pickLimit(applyMode)"
					label="Что применить"
				/>
			</div>
		</div>

		<template #footer>
			<UiButton variant="ghost" @click="emit('close')">Отмена</UiButton>
			<UiButton :disabled="!canConfirm" @click="emit('confirm', pickedIds)">
				Применить
			</UiButton>
		</template>
	</UiDialog>
</template>

<style scoped>
.dialog {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.dialog__block {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}
</style>
