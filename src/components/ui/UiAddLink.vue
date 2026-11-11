<script setup lang="ts">
import UiIcon from './UiIcon.vue'
</script>

<template>
	<button class="ui-add-link" type="button">
		<UiIcon name="plus" :size="15" />
		<slot />
	</button>
</template>

<style scoped>
/* quiet: what is optional stays folded until someone asks for it */
.ui-add-link {
	display: inline-flex;
	align-items: center;
	align-self: flex-start;
	gap: 6px;
	height: 32px;
	margin-left: -8px;
	padding: 0 10px 0 8px;
	font: 600 14px / 1 var(--font-body);
	color: var(--text-muted);
	border-radius: var(--radius-sm);
	cursor: pointer;
	transition:
		background var(--dur-fast) var(--ease-out),
		color var(--dur-fast) var(--ease-out);
}

.ui-add-link:hover {
	color: var(--text-strong);
	background: var(--surface-sunken);
}
</style>
