<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'

import UiIconButton from './UiIconButton.vue'

type Props = {
	open?: boolean
	title?: string
	width?: number
}

const { open = true, width = 480 } = defineProps<Props>()

const emit = defineEmits<{ close: [] }>()

function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape') emit('close')
}

watch(
	() => open,
	(isOpen) => {
		if (isOpen) window.addEventListener('keydown', onKeydown)
		else window.removeEventListener('keydown', onKeydown)
	},
	{ immediate: true },
)

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
	<Teleport to="body">
		<div v-if="open" class="ui-dialog-overlay">
			<div
				class="ui-dialog"
				role="dialog"
				aria-modal="true"
				:style="{ width: `${width}px` }"
			>
				<div class="ui-dialog__head">
					<div class="ui-dialog__title">{{ title }}</div>
					<UiIconButton icon="x" label="Закрыть" size="sm" @click="emit('close')" />
				</div>
				<div class="ui-dialog__body">
					<slot />
				</div>
			</div>
		</div>
	</Teleport>
</template>

<style scoped>
.ui-dialog-overlay {
	position: fixed;
	inset: 0;
	z-index: 100;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
	background: var(--surface-overlay);
	backdrop-filter: blur(4px);
}

.ui-dialog {
	display: flex;
	flex-direction: column;
	max-width: 100%;
	max-height: 100%;
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-xl);
	box-shadow: var(--shadow-3);
}

.ui-dialog__head {
	flex: none;
	display: flex;
	align-items: flex-start;
	gap: 12px;
	padding: 22px 22px 0 24px;
}

.ui-dialog__title {
	flex: 1;
	font: var(--type-h3);
	color: var(--text-strong);
}

.ui-dialog__body {
	min-height: 0;
	overflow-y: auto;
	padding: 12px 24px 24px;
	font: var(--type-body);
	color: var(--text-body);
}
</style>
