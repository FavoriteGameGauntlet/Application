<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ResourceRef } from '../../../api-facade/contracts'
import UiButton from '../../../components/ui/UiButton.vue'
import UiCheckbox from '../../../components/ui/UiCheckbox.vue'
import UiDialog from '../../../components/ui/UiDialog.vue'

type Props = {
	/** the entries of the item that fell; set while the dialog is open */
	entries: ResourceRef[] | null
}

const { entries } = defineProps<Props>()

const emit = defineEmits<{ close: []; confirm: [entryIds: number[]] }>()

const picked = ref<number[]>([])

const canConfirm = computed(() => picked.value.length > 0)

const toggle = (entryId: number, on: boolean) => {
	picked.value = on
		? [...picked.value, entryId]
		: picked.value.filter((x) => x !== entryId)
}

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
				<span class="label">Отметь изменения, которые сработают</span>

				<UiCheckbox
					v-for="entry in entries"
					:key="entry.entryId"
					:label="entry.text ?? entry.name"
					:model-value="picked.includes(entry.entryId!)"
					@update:model-value="toggle(entry.entryId!, $event)"
				/>
			</div>

			<div class="dialog__actions">
				<UiButton variant="outline" @click="emit('close')">Отмена</UiButton>
				<UiButton
					icon="check"
					:disabled="!canConfirm"
					@click="emit('confirm', [...picked])"
				>
					Применить
				</UiButton>
			</div>
		</div>
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

.dialog__actions {
	display: flex;
	gap: 8px;
	justify-content: flex-end;
}
</style>
