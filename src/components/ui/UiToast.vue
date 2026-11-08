<script setup lang="ts">
import { computed } from 'vue'
import UiIcon from './UiIcon.vue'

type Props = {
	tone?: 'info' | 'success' | 'danger'
	title?: string
}

const { tone = 'info' } = defineProps<Props>()

const emit = defineEmits<{ close: [] }>()

const toneIcons = {
	info: { icon: 'info', color: 'var(--info)' },
	success: { icon: 'check-circle-2', color: 'var(--success)' },
	danger: { icon: 'alert-triangle', color: 'var(--danger)' },
}

const toneIcon = computed(() => toneIcons[tone])
</script>

<template>
	<div class="ui-toast" role="status">
		<UiIcon
			class="ui-toast__icon"
			:name="toneIcon.icon"
			:size="20"
			:color="toneIcon.color"
		/>
		<div class="ui-toast__content">
			<div v-if="title" class="ui-toast__title" :class="{ 'ui-toast__title--gap': $slots.default }">
				{{ title }}
			</div>
			<div v-if="$slots.default" class="ui-toast__text">
				<slot />
			</div>
		</div>
		<button class="ui-toast__close" aria-label="Закрыть" @click="emit('close')">
			<UiIcon name="x" :size="16" />
		</button>
	</div>
</template>

<style scoped>
.ui-toast {
	display: flex;
	align-items: flex-start;
	gap: 12px;
	width: 360px;
	max-width: 100%;
	padding: 14px 14px 14px 16px;
	color: var(--text-on-floating);
	background: var(--surface-floating);
	border: 1px solid var(--border-floating);
	border-radius: var(--radius-md);
	box-shadow: var(--shadow-3);
}

.ui-toast__icon {
	margin-top: 1px;
}

.ui-toast__content {
	flex: 1;
	min-width: 0;
}

.ui-toast__title {
	font: 700 14px / 1.3 var(--font-display);
}

.ui-toast__title--gap {
	margin-bottom: 2px;
}

.ui-toast__text {
	font: var(--type-body-sm);
	color: var(--text-on-floating-muted);
}

.ui-toast__close {
	display: flex;
	padding: 2px;
	color: var(--navy-300);
	cursor: pointer;
}
</style>
