<script setup lang="ts">
type Props = {
	removable?: boolean
}

const { removable } = defineProps<Props>()

const emit = defineEmits<{ remove: [] }>()
</script>

<template>
	<span class="ui-tag">
		<slot />
		<button
			v-if="removable"
			class="ui-tag__remove"
			type="button"
			aria-label="Убрать"
			@click.stop="emit('remove')"
		>
			×
		</button>
	</span>
</template>

<style scoped>
.ui-tag {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 30px;
	padding: 0 12px;
	font: 500 13px / 1 var(--font-body);
	color: var(--text-body);
	background: var(--surface-card);
	border: var(--border-width) solid var(--border-default);
	border-radius: var(--radius-pill);
}

.ui-tag__remove {
	font-size: 15px;
	line-height: 1;
	cursor: pointer;
	opacity: 0.6;
}

.ui-tag__remove:hover {
	opacity: 1;
}
</style>
