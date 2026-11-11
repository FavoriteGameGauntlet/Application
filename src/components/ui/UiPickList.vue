<script setup lang="ts">
import UiIcon from './UiIcon.vue'
import UiUserAvatar from './UiUserAvatar.vue'

export type PickOption = {
	value: string
	label: string
	/** the quiet text at the end of the row */
	meta?: string
	/** a player: the row starts with an avatar of this color */
	color?: string
}

type Props = {
	options: PickOption[]
	/** how many are picked at most; 1 makes it a choice of one */
	limit?: number
	label?: string
}

const { options, limit } = defineProps<Props>()

const model = defineModel<string[]>({ default: () => [] })

const isOn = (value: string) => model.value.includes(value)

/** the list is full, so only a picked row can still be changed */
const isLocked = (value: string) =>
	limit !== undefined &&
	limit > 1 &&
	model.value.length >= limit &&
	!isOn(value)

const toggle = (value: string) => {
	if (isLocked(value)) return

	if (limit === 1) {
		model.value = [value]
	} else {
		model.value = isOn(value)
			? model.value.filter((v) => v !== value)
			: [...model.value, value]
	}
}
</script>

<template>
	<div class="ui-pick-list" role="group" :aria-label="label">
		<button
			v-for="o in options"
			:key="o.value"
			class="ui-pick-list__row"
			:class="{
				'ui-pick-list__row--on': isOn(o.value),
				'ui-pick-list__row--off': isLocked(o.value),
			}"
			type="button"
			:role="limit === 1 ? 'radio' : 'checkbox'"
			:aria-checked="isOn(o.value)"
			:disabled="isLocked(o.value)"
			@click="toggle(o.value)"
		>
			<span
				class="ui-pick-list__mark"
				:class="{
					'ui-pick-list__mark--radio': limit === 1,
					'ui-pick-list__mark--on': isOn(o.value),
				}"
				aria-hidden="true"
			>
				<UiIcon v-if="limit !== 1 && isOn(o.value)" name="check" :size="14" />
			</span>
			<UiUserAvatar
				v-if="o.color"
				:name="o.label"
				:color="o.color"
				:size="26"
			/>
			<span class="ui-pick-list__label">{{ o.label }}</span>
			<span v-if="o.meta" class="ui-pick-list__meta">{{ o.meta }}</span>
		</button>
	</div>
</template>

<style scoped>
.ui-pick-list {
	display: flex;
	flex-direction: column;
	gap: 2px;
	margin: 0 -10px;
}

.ui-pick-list__row {
	display: flex;
	align-items: center;
	gap: 12px;
	min-height: 44px;
	padding: 0 10px;
	font: 500 16px / 1.45 var(--font-body);
	color: var(--text-strong);
	text-align: left;
	cursor: pointer;
	border-radius: var(--radius-md);
	outline: 0;
}

.ui-pick-list__row:focus-visible {
	box-shadow: var(--shadow-focus);
}

.ui-pick-list__row--on {
	background: var(--accent-soft);
}

.ui-pick-list__row--off {
	cursor: not-allowed;
	opacity: 0.45;
}

.ui-pick-list__mark {
	display: inline-flex;
	flex: none;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	color: var(--fgg-navy);
	border: var(--border-width-strong) solid var(--border-default);
	border-radius: var(--radius-xs);
}

.ui-pick-list__mark--radio {
	border-radius: 50%;
}

.ui-pick-list__mark--on {
	background: var(--accent);
	border-color: var(--accent);
}

/* the ring of the radio: the accent disc with a card-colored gap inside */
.ui-pick-list__mark--radio.ui-pick-list__mark--on {
	box-shadow: inset 0 0 0 4px var(--surface-card);
}

.ui-pick-list__label {
	min-width: 0;
}

.ui-pick-list__meta {
	margin-left: auto;
	font: 500 13px / 1 var(--font-mono);
	font-variant-numeric: tabular-nums;
	color: var(--text-muted);
	white-space: nowrap;
}
</style>
