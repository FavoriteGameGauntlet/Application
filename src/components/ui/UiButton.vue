<script setup lang="ts">
type Props = {
	disabled?: boolean
}

defineProps<Props>()
</script>

<template>
	<button class="ui-button" :disabled>
		<slot />
	</button>
</template>

<style scoped>
.ui-button {
	cursor: pointer;
	height: 100%;
	width: 100%;
	border: 1px solid var(--color-muted);
	border-radius: 6px;
	background: transparent;
}

.ui-button:hover:not(:disabled) {
	background-color: var(--color-hover-bg);
}

.ui-button:disabled {
	opacity: 50%;
	pointer-events: none;
}
</style>
