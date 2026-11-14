<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { SystemParameter } from '../../api-facade/contracts'
import type { FormField, FormValues } from '../../components/formDialog'
import FormDialog from '../../components/FormDialog.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import UiRowMenu, { type RowMenuItem } from '../../components/ui/UiRowMenu.vue'
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
		return [{ key: 'value', label: 'Да', type: 'check' }]

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

const menuOf = (parameter: SystemParameter): RowMenuItem[] => [
	{ label: 'Изменить', icon: 'pencil', select: () => edit(parameter) },
	...(parameter.isDefault
		? []
		: [
				{
					label: 'Вернуть по умолчанию',
					icon: 'rotate-ccw',
					select: () => store.reset(parameter),
				},
			]),
]

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

		<div class="table" role="table" aria-label="Системные параметры">
			<div class="table__row table__row--head" role="row">
				<span role="columnheader">Параметр</span>
				<span role="columnheader">Значение</span>
			</div>

			<UiRowMenu
				v-for="parameter in store.parameters"
				:key="parameter.code"
				class="table__row table__row--body"
				role="row"
				label="Действия с параметром"
				:items="menuOf(parameter)"
			>
				<span class="parameter" role="cell">
					<span class="parameter__name">
						{{ parameter.name }}
						<UiBadge v-if="!parameter.isDefault" tone="accent"
							>изменено</UiBadge
						>
					</span>
					<span class="parameter__description">{{
						parameter.description
					}}</span>
				</span>

				<span class="value" role="cell">
					<span class="value__main">{{
						showValue(parameter, parameter.value)
					}}</span>
					<span v-if="!parameter.isDefault" class="value__default">
						по умолчанию:
						<b>{{ showValue(parameter, parameter.defaultValue) }}</b>
					</span>
				</span>
			</UiRowMenu>

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

/* the narrow column is set in rem because the app scales; the name takes the rest; 60px on the right belong to the «⋯» button */
.table__row {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 12rem;
	gap: 16px;
	align-items: center;
}

.table__row--head {
	padding: 12px 60px 12px 20px;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
	background: var(--surface-sunken);
}

.table__row--body {
	min-height: 52px;
	padding: 8px 60px 8px 20px;
	border-top: 1px solid var(--border-subtle);
}

.table__row--body:hover {
	background: var(--surface-sunken);
}

.table__empty {
	padding: 16px 20px;
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
	display: flex;
	align-items: center;
	gap: 8px;
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
	flex-direction: column;
	gap: 2px;
}

.value__main {
	font: 500 15px / 1.3 var(--font-mono);
	font-variant-numeric: tabular-nums;
	color: var(--text-strong);
}

.value__default {
	font: var(--type-caption);
	color: var(--text-subtle);
}

.value__default b {
	font: var(--type-mono);
	color: var(--text-muted);
}
</style>
