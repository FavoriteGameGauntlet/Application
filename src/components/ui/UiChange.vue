<script setup lang="ts">
type Props = {
	/** green adds, red takes */
	tone?: 'neutral' | 'plus' | 'minus'
}

const { tone = 'neutral' } = defineProps<Props>()
</script>

<template>
	<span class="ui-change" :class="`ui-change--${tone}`">
		<slot />
	</span>
</template>

<style scoped>
.ui-change {
	display: inline-flex;
	align-items: center;
	min-height: 26px;
	padding: 4px 10px;
	font: 500 var(--fs-12) / 1.2 var(--font-body);
	color: var(--ui-change-fg);
	background: var(--ui-change-bg);
	border-radius: var(--radius-pill);
}

.ui-change--neutral {
	--ui-change-bg: var(--surface-sunken);
	--ui-change-fg: var(--text-body);
}

.ui-change--plus {
	--ui-change-bg: var(--success-soft);
	--ui-change-fg: var(--success-text);
}

.ui-change--minus {
	--ui-change-bg: var(--danger-soft);
	--ui-change-fg: var(--danger-text);
}
</style>
