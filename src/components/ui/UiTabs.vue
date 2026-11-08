<script setup lang="ts">
import { computed } from 'vue'

type Item = string | { value: string; label: string; count?: number }

type Props = {
	items?: Item[]
	variant?: 'underline' | 'pill'
}

const { items = [], variant = 'underline' } = defineProps<Props>()

const model = defineModel<string>()

const normalizedItems = computed(() =>
	items.map((i) => (typeof i === 'string' ? { value: i, label: i } : i)),
)
</script>

<template>
	<div class="ui-tabs" :class="`ui-tabs--${variant}`" role="tablist">
		<button
			v-for="item in normalizedItems"
			:key="item.value"
			class="ui-tabs__tab"
			:class="{ 'ui-tabs__tab--on': item.value === model }"
			role="tab"
			:aria-selected="item.value === model"
			@click="model = item.value"
		>
			{{ item.label }}
			<span v-if="item.count != null" class="ui-tabs__count">{{ item.count }}</span>
		</button>
	</div>
</template>

<style scoped>
.ui-tabs {
	display: flex;
}

.ui-tabs--underline {
	gap: 24px;
	border-bottom: 1px solid var(--border-subtle);
}

.ui-tabs--pill {
	gap: 4px;
	padding: 4px;
	background: var(--surface-sunken);
	border-radius: var(--radius-md);
}

.ui-tabs__tab {
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font: 700 13px / 1 var(--font-display);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
	cursor: pointer;
}

.ui-tabs__tab--on {
	color: var(--text-strong);
}

.ui-tabs--underline .ui-tabs__tab {
	height: 44px;
}

.ui-tabs--underline .ui-tabs__tab--on::after {
	content: '';
	position: absolute;
	left: 0;
	right: 0;
	bottom: -1px;
	height: 3px;
	border-radius: 2px;
	background: var(--accent);
}

.ui-tabs--pill .ui-tabs__tab {
	height: 34px;
	padding: 0 14px;
	border-radius: var(--radius-sm);
}

.ui-tabs--pill .ui-tabs__tab--on {
	background: var(--surface-card);
	box-shadow: var(--shadow-1);
}

.ui-tabs__count {
	font-family: var(--font-mono);
	font-weight: 500;
	letter-spacing: 0;
	color: var(--text-subtle);
}
</style>
