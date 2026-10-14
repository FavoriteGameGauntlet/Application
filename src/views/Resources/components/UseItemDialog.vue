<script setup lang="ts">
import type { ItemStack } from '../../../api-facade/contracts'
import UiButton from '../../../components/ui/UiButton.vue'
import UiDialog from '../../../components/ui/UiDialog.vue'
import { useResourcesStore } from '../../../stores/resourcesStore'

type Props = {
	item?: ItemStack
}

const { item } = defineProps<Props>()

const emit = defineEmits<{ close: [] }>()

const resourcesStore = useResourcesStore()

const onConfirm = async () => {
	const used = item

	emit('close')

	if (used) {
		await resourcesStore.useItem(used)
	}
}
</script>

<template>
	<UiDialog
		:open="!!item"
		:title="item ? `Использовать «${item.name}»` : ''"
		:width="420"
		@close="emit('close')"
	>
		<div class="dialog">
			<div class="dialog__change">
				<span class="label">Что произойдёт</span>
				<span class="dialog__text">{{ item?.description }}</span>
			</div>

			<div class="dialog__actions">
				<UiButton variant="outline" @click="emit('close')">Отмена</UiButton>
				<UiButton icon="check" @click="onConfirm">Использовать</UiButton>
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

.dialog__change {
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

.dialog__text {
	font: var(--type-body);
	color: var(--text-body);
}

.dialog__actions {
	display: flex;
	gap: 8px;
	justify-content: flex-end;
}
</style>
