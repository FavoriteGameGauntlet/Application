<script setup lang="ts">
import {
	computed,
	onMounted,
	useTemplateRef,
	type InputTypeHTMLAttribute,
} from 'vue'
import UiField from './UiField.vue'
import UiIcon from './UiIcon.vue'

defineOptions({ inheritAttrs: false })

type Props = {
	type?: InputTypeHTMLAttribute
	label?: string
	hint?: string
	error?: string
	/** the value is wrong: the border turns red, the text of the problem is elsewhere */
	invalid?: boolean
	icon?: string
	disabled?: boolean
	autoFocus?: boolean
	/** 40px high, for dense forms */
	compact?: boolean
	/** a quiet label for a field inside a titled group */
	sub?: boolean
	/** digits in the mono face, with the numeric keyboard */
	numeric?: boolean
}

const { type, autoFocus } = defineProps<Props>()

const model = defineModel<string>({ default: '' })
/** a password field shows its text; bind it to share one state between fields */
const revealed = defineModel<boolean>('revealed', { default: false })

const isPassword = computed(() => type === 'password')
const inputType = computed(() =>
	isPassword.value && revealed.value ? 'text' : type,
)

const input = useTemplateRef('input')

onMounted(() => {
	if (autoFocus) {
		input.value?.focus()
	}
})
</script>

<template>
	<UiField :label :hint :error :sub>
		<span
			class="ui-input"
			:class="{
				'ui-input--error': error || invalid,
				'ui-input--disabled': disabled,
				'ui-input--compact': compact,
				'ui-input--numeric': numeric,
			}"
		>
			<UiIcon v-if="icon" :name="icon" :size="18" />
			<input
				ref="input"
				v-model="model"
				v-bind="$attrs"
				:type="inputType"
				:inputmode="numeric ? 'numeric' : undefined"
				:disabled
			/>
			<!-- mousedown.prevent keeps the caret in the field -->
			<button
				v-if="isPassword"
				type="button"
				class="ui-input__reveal"
				:aria-label="revealed ? 'Скрыть пароль' : 'Показать пароль'"
				:title="revealed ? 'Скрыть пароль' : 'Показать пароль'"
				:disabled
				@mousedown.prevent
				@click="revealed = !revealed"
			>
				<UiIcon :name="revealed ? 'eye-off' : 'eye'" :size="18" />
			</button>
		</span>
	</UiField>
</template>

<style scoped>
.ui-input {
	display: flex;
	align-items: center;
	gap: 8px;
	height: 44px;
	padding: 0 14px;
	color: var(--text-muted);
	background: var(--surface-card);
	border: var(--border-width) solid var(--border-default);
	border-radius: var(--radius-sm);
	transition: box-shadow var(--dur-fast) var(--ease-out);
}

/* keyed on the input, so focus on the reveal button rings only the button */
.ui-input:has(input:focus) {
	border-color: var(--border-strong);
	box-shadow: var(--shadow-focus);
}

.ui-input--error,
.ui-input--error:has(input:focus) {
	border-color: var(--danger);
}

.ui-input--disabled {
	background: var(--surface-sunken);
}

.ui-input--compact {
	height: 40px;
	padding: 0 10px;
}

.ui-input--numeric input {
	font: 500 15px / 1 var(--font-mono);
	font-variant-numeric: tabular-nums;
}

input {
	flex: 1;
	min-width: 0;
	font: var(--type-body);
	color: var(--text-strong);
	outline: 0;
	box-shadow: none;
}

/* WebView2 draws its own eye, which vanishes after a blur */
input::-ms-reveal {
	display: none;
}

.ui-input__reveal {
	display: inline-flex;
	flex: none;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	margin-right: -7px;
	padding: 0;
	color: var(--text-muted);
	background: none;
	border: 0;
	border-radius: var(--radius-xs);
	cursor: pointer;
	transition: color var(--dur-fast) var(--ease-out);
}

.ui-input__reveal:hover:not(:disabled) {
	color: var(--text-strong);
}

.ui-input__reveal:disabled {
	cursor: not-allowed;
}
</style>
