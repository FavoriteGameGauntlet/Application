<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import UiIcon from './UiIcon.vue'

export type OptionGroup = {
	title?: string
	options: { value: string; label: string; hint?: string; meta?: string }[]
}

type Props = {
	groups: OptionGroup[]
	selected?: string
	/** a search field above the options */
	search?: boolean
}

const { groups, search } = defineProps<Props>()

const emit = defineEmits<{ select: [value: string] }>()

const query = ref('')
const list = useTemplateRef<HTMLElement>('list')

const found = computed(() => {
	const q = query.value.trim().toLowerCase()

	return groups
		.map((g) => ({
			...g,
			options: g.options.filter((o) => !q || o.label.toLowerCase().includes(q)),
		}))
		.filter((g) => g.options.length)
})

/** Enter in the search field takes the first match */
function pickFirst() {
	const first = found.value[0]?.options[0]

	if (first) emit('select', first.value)
}

// the focus goes into the panel so that the keyboard works at once
onMounted(async () => {
	await nextTick()
	list.value
		?.querySelector<HTMLElement>(
			search ? 'input' : '[aria-selected="true"], [role="option"]',
		)
		?.focus()
})
</script>

<template>
	<div ref="list" class="ui-option-list">
		<label v-if="search" class="ui-option-list__search">
			<UiIcon name="search" :size="15" />
			<input
				v-model="query"
				placeholder="Найти"
				aria-label="Найти"
				@keydown.enter.prevent="pickFirst"
			/>
		</label>

		<div role="listbox" class="ui-option-list__options">
			<template v-for="(group, i) in found" :key="i">
				<div v-if="group.title" class="ui-option-list__group">
					{{ group.title }}
				</div>
				<button
					v-for="o in group.options"
					:key="o.value"
					class="ui-option-list__option"
					:class="{ 'ui-option-list__option--on': o.value === selected }"
					type="button"
					role="option"
					:aria-selected="o.value === selected"
					@click="emit('select', o.value)"
				>
					<span class="ui-option-list__text">
						{{ o.label }}
						<small v-if="o.hint">{{ o.hint }}</small>
					</span>
					<span v-if="o.meta" class="ui-option-list__meta">{{ o.meta }}</span>
				</button>
			</template>

			<div v-if="!found.length" class="ui-option-list__empty">
				Ничего не нашлось
			</div>
		</div>
	</div>
</template>

<style scoped>
.ui-option-list {
	display: flex;
	flex-direction: column;
}

.ui-option-list__search {
	display: flex;
	align-items: center;
	gap: 8px;
	height: 38px;
	margin-bottom: 4px;
	padding: 0 10px;
	color: var(--text-muted);
	background: var(--surface-sunken);
	border-radius: var(--radius-sm);
}

.ui-option-list__search input {
	flex: 1;
	min-width: 0;
	font: var(--type-body-sm);
	color: var(--text-strong);
	outline: 0;
	box-shadow: none;
}

.ui-option-list__options {
	display: flex;
	flex-direction: column;
}

.ui-option-list__group {
	padding: 10px 10px 4px;
	font: 700 11px / 1 var(--font-display);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.ui-option-list__option {
	display: flex;
	align-items: baseline;
	gap: 10px;
	padding: 8px 10px;
	text-align: left;
	font: 500 15px / 1.3 var(--font-body);
	color: var(--text-strong);
	border-radius: var(--radius-sm);
	cursor: pointer;
}

.ui-option-list__option:hover,
.ui-option-list__option:focus-visible {
	background: var(--surface-sunken);
}

.ui-option-list__option--on {
	background: var(--accent-soft);
}

.ui-option-list__text {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.ui-option-list__text small {
	font: var(--type-caption);
	color: var(--text-muted);
}

.ui-option-list__meta {
	margin-left: auto;
	font: 500 12px / 1 var(--font-mono);
	color: var(--text-muted);
}

.ui-option-list__empty {
	padding: 10px;
	font: var(--type-body-sm);
	color: var(--text-muted);
}
</style>
