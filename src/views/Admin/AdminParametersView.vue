<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { SystemParameter } from '../../api-facade/contracts'
import type { FormField, FormValues } from '../../components/formDialog'
import FormDialog from '../../components/FormDialog.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiIconButton from '../../components/ui/UiIconButton.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import { useAdminParametersStore } from '../../stores/adminParametersStore'
import { useToastStore } from '../../stores/toastStore'
import {
	checkParameterValue,
	parameterRange,
} from '../../utils/systemParameter'

const store = useAdminParametersStore()
const toastStore = useToastStore()

/** the parameter in the edit dialog, undefined means the dialog is closed */
const editing = ref<SystemParameter>()

/** what the admin has typed so far, to say at once why it does not fit */
const typed = ref('')

const showValue = (parameter: SystemParameter, value: string) =>
	parameter.type === 'bool' ? (value === 'true' ? 'да' : 'нет') : value

const textOf = (values: FormValues) =>
	typeof values.value === 'boolean'
		? String(values.value)
		: String(values.value).trim()

const problem = computed(() =>
	editing.value ? checkParameterValue(editing.value, typed.value) : undefined,
)

const fields = computed<FormField[]>(() => {
	const parameter = editing.value

	if (!parameter) return []

	if (parameter.type === 'bool')
		return [{ key: 'value', label: parameter.name, type: 'check' }]

	const range = parameterRange(parameter)

	return [
		{
			key: 'value',
			label: 'Значение',
			numeric: true,
			required: 'значение',
			hint: problem.value ?? (range ? `Допустимо: ${range}.` : undefined),
			invalid: !!problem.value,
		},
	]
})

const initial = computed<FormValues>(() => ({
	value:
		editing.value?.type === 'bool'
			? editing.value.value === 'true'
			: (editing.value?.value ?? ''),
}))

const edit = (parameter: SystemParameter) => {
	typed.value = parameter.value
	editing.value = parameter
}

const onSave = async (values: FormValues) => {
	const parameter = editing.value
	const value = textOf(values)

	if (!parameter) return

	const wrong = checkParameterValue(parameter, value)

	if (wrong) {
		toastStore.show('Проверь значение', wrong, 'danger')
		return
	}

	if (await store.save(parameter, value)) editing.value = undefined
}

onMounted(async () => {
	try {
		await store.load()
	} catch (e) {
		toastStore.error(e)
	}
})
</script>

<template>
	<div class="parameters">
		<UiPageTitle>Системные параметры</UiPageTitle>

		<div class="table">
			<div class="table__row table__row--head">
				<span>Параметр</span>
				<span>Значение</span>
				<span>По умолчанию</span>
				<span>Допустимо</span>
				<span></span>
			</div>

			<div
				v-for="parameter in store.parameters"
				:key="parameter.code"
				class="table__row table__row--body"
			>
				<span class="parameter">
					<span class="parameter__name">{{ parameter.name }}</span>
					<span class="parameter__description">{{
						parameter.description
					}}</span>
				</span>

				<span class="value">
					{{ showValue(parameter, parameter.value) }}
					<UiBadge v-if="!parameter.isDefault" tone="accent">изменено</UiBadge>
				</span>

				<span class="default">
					{{ showValue(parameter, parameter.defaultValue) }}
				</span>

				<span class="default">{{ parameterRange(parameter) ?? '—' }}</span>

				<span class="table__actions">
					<UiIconButton
						icon="pencil"
						size="sm"
						label="Изменить"
						@click="edit(parameter)"
					/>
					<UiIconButton
						v-if="!parameter.isDefault"
						icon="rotate-ccw"
						size="sm"
						label="Вернуть значение по умолчанию"
						@click="store.reset(parameter)"
					/>
				</span>
			</div>

			<div v-if="!store.parameters.length" class="table__empty">
				Параметров нет.
			</div>
		</div>
	</div>

	<FormDialog
		:open="!!editing"
		:title="editing?.name ?? ''"
		:subtitle="editing?.description"
		plain-title
		:sections="[{ fields }]"
		:initial
		@change="typed = textOf($event)"
		@close="editing = undefined"
		@save="onSave"
	/>
</template>

<style scoped>
.parameters {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.table {
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.table__row {
	display: grid;
	grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) 120px 140px 76px;
	gap: 12px;
	align-items: center;
}

.table__row--head {
	padding: 12px 16px;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
	background: var(--surface-sunken);
}

.table__row--body {
	min-height: 52px;
	padding: 8px 16px;
	border-top: 1px solid var(--border-subtle);
}

.table__actions {
	display: flex;
	gap: 4px;
	justify-content: flex-end;
}

.table__empty {
	padding: 16px;
	font: var(--type-body-sm);
	color: var(--text-subtle);
	border-top: 1px solid var(--border-subtle);
}

.parameter {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.parameter__name {
	font: 600 15px / 1.45 var(--font-body);
	color: var(--text-strong);
}

.parameter__description {
	font: var(--type-body-sm);
	color: var(--text-muted);
	text-wrap: pretty;
}

.value {
	display: flex;
	align-items: center;
	gap: 8px;
	font: var(--type-mono);
	color: var(--text-strong);
}

.default {
	font: var(--type-mono);
	color: var(--text-muted);
}
</style>
