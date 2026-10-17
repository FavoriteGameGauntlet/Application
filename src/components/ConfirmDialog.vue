<script setup lang="ts">
import UiButton from './ui/UiButton.vue'
import UiDialog from './ui/UiDialog.vue'

type Props = {
	open: boolean
	title: string
	text: string
	okLabel?: string
}

const { okLabel = 'Удалить' } = defineProps<Props>()

const emit = defineEmits<{ close: []; confirm: [] }>()
</script>

<template>
	<UiDialog :open :title :width="420" @close="emit('close')">
		<div class="confirm">
			<span class="confirm__text">{{ text }}</span>

			<div class="confirm__actions">
				<UiButton variant="outline" @click="emit('close')">Отмена</UiButton>
				<UiButton variant="danger" icon="trash-2" @click="emit('confirm')">
					{{ okLabel }}
				</UiButton>
			</div>
		</div>
	</UiDialog>
</template>

<style scoped>
.confirm {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.confirm__text {
	text-wrap: pretty;
}

.confirm__actions {
	display: flex;
	gap: 8px;
	justify-content: flex-end;
}
</style>
