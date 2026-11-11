<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import UiAddLink from './UiAddLink.vue'
import UiIcon from './UiIcon.vue'
import UiOptionList from './UiOptionList.vue'
import UiPopover from './UiPopover.vue'

type Props = {
	options: { value: string; label: string; hint?: string }[]
	/** the text of the "+" link that adds one more */
	addLabel: string
	label?: string
}

const { options } = defineProps<Props>()

const model = defineModel<string[]>({ default: () => [] })

const open = ref(false)
const anchor = useTemplateRef<HTMLElement>('anchor')

const chosen = computed(() =>
	model.value.map(
		(v) => options.find((o) => o.value === v) ?? { value: v, label: v },
	),
)

const rest = computed(() => [
	{ options: options.filter((o) => !model.value.includes(o.value)) },
])

function onSelect(value: string) {
	model.value = [...model.value, value]
	open.value = false
}
</script>

<template>
	<div class="ui-pick-chips" role="group" :aria-label="label">
		<span v-for="c in chosen" :key="c.value" class="ui-pick-chips__chip">
			{{ c.label }}
			<button
				class="ui-pick-chips__x"
				type="button"
				aria-label="Убрать"
				@click="model = model.filter((v) => v !== c.value)"
			>
				<UiIcon name="x" :size="15" />
			</button>
		</span>

		<span
			v-if="rest[0].options.length"
			ref="anchor"
			:class="{ 'ui-pick-chips__add--beside': chosen.length }"
		>
			<UiAddLink @click="open = !open">{{ addLabel }}</UiAddLink>
		</span>

		<UiPopover :open :anchor :min-width="260" @close="open = false">
			<UiOptionList :groups="rest" @select="onSelect" />
		</UiPopover>
	</div>
</template>

<style scoped>
.ui-pick-chips {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px;
}

.ui-pick-chips__chip {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 30px;
	padding: 0 6px 0 12px;
	font: 500 14px / 1 var(--font-body);
	color: var(--text-strong);
	background: var(--surface-sunken);
	border-radius: var(--radius-pill);
}

.ui-pick-chips__x {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	color: var(--text-muted);
	border-radius: 50%;
	cursor: pointer;
}

.ui-pick-chips__x:hover {
	color: var(--text-strong);
}

/* next to the chips the link does not hang out to the left */
.ui-pick-chips__add--beside :deep(.ui-add-link) {
	margin-left: 0;
}
</style>
