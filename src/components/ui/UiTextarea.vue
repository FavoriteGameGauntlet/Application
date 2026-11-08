<script setup lang="ts">
import UiField from './UiField.vue'

defineOptions({ inheritAttrs: false })

type Props = {
	label?: string
	hint?: string
	error?: string
}

defineProps<Props>()

const model = defineModel<string>({ default: '' })
</script>

<template>
	<UiField :label :hint :error>
		<textarea v-model="model" v-bind="$attrs" class="ui-textarea" rows="3"></textarea>
	</UiField>
</template>

<style scoped>
.ui-textarea {
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

.ui-textarea:focus {
	border-color: var(--border-strong);
	box-shadow: var(--shadow-focus);
}
</style>
