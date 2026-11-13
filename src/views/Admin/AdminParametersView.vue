<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import type { SystemParameter } from '../../api-facade/contracts'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiInput from '../../components/ui/UiInput.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import UiSwitch from '../../components/ui/UiSwitch.vue'
import { useAdminParametersStore } from '../../stores/adminParametersStore'
import { useToastStore } from '../../stores/toastStore'
import {
	checkParameterValue,
	parameterRange,
} from '../../utils/systemParameter'

const store = useAdminParametersStore()
const toastStore = useToastStore()

const draft = reactive<Record<string, string>>({})

const syncDraft = () => {
	for (const parameter of store.parameters)
		draft[parameter.code] = parameter.value
}

const valueOf = (parameter: SystemParameter) =>
	(draft[parameter.code] ?? '').trim()

const isChanged = (parameter: SystemParameter) =>
	valueOf(parameter) !== parameter.value

/** a value that was not touched has nothing to complain about */
const problemOf = (parameter: SystemParameter) =>
	isChanged(parameter)
		? checkParameterValue(parameter, valueOf(parameter))
		: undefined

const showValue = (parameter: SystemParameter, value: string) =>
	parameter.type === 'bool' ? (value === 'true' ? 'да' : 'нет') : value

const onSave = async (parameter: SystemParameter) => {
	if (!isChanged(parameter) || problemOf(parameter)) return

	if (await store.save(parameter, valueOf(parameter))) syncDraft()
}

const onReset = async (parameter: SystemParameter) => {
	if (await store.reset(parameter)) syncDraft()
}

onMounted(async () => {
	try {
		await store.load()
		syncDraft()
	} catch (e) {
		toastStore.error(e)
	}
})
</script>

<template>
	<div class="parameters">
		<UiPageTitle>Системные параметры</UiPageTitle>

		<div
			v-for="parameter in store.parameters"
			:key="parameter.code"
			class="card"
		>
			<div class="card__head">
				<span class="card__label">{{ parameter.name }}</span>
				<UiBadge v-if="!parameter.isDefault" tone="accent">изменено</UiBadge>
			</div>

			<span class="card__hint">{{ parameter.description }}</span>

			<div class="card__row">
				<UiSwitch
					v-if="parameter.type === 'bool'"
					:model-value="draft[parameter.code] === 'true'"
					:label="draft[parameter.code] === 'true' ? 'Да' : 'Нет'"
					@update:model-value="draft[parameter.code] = String($event)"
				/>
				<div v-else class="card__input">
					<UiInput
						v-model="draft[parameter.code]"
						inputmode="numeric"
						:aria-label="parameter.name"
						:error="problemOf(parameter)"
						@keydown.enter="onSave(parameter)"
					/>
				</div>
				<span class="card__default">
					по умолчанию: {{ showValue(parameter, parameter.defaultValue) }}
					<template v-if="parameterRange(parameter)">
						· {{ parameterRange(parameter) }}
					</template>
				</span>
				<div class="card__spacer"></div>
				<UiButton
					v-if="!parameter.isDefault"
					variant="ghost"
					size="sm"
					icon="rotate-ccw"
					@click="onReset(parameter)"
				>
					Сбросить
				</UiButton>
				<UiButton
					variant="secondary"
					icon="check"
					:disabled="!isChanged(parameter) || !!problemOf(parameter)"
					@click="onSave(parameter)"
				>
					Сохранить
				</UiButton>
			</div>
		</div>

		<span v-if="!store.parameters.length" class="note">Параметров нет.</span>
	</div>
</template>

<style scoped>
.parameters {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 760px;
}

.card {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.card__head {
	display: flex;
	align-items: center;
	gap: 8px;
}

.card__label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.card__hint {
	font: var(--type-body-sm);
	color: var(--text-muted);
	text-wrap: pretty;
}

.card__row {
	display: flex;
	align-items: center;
	gap: 12px;
	padding-top: 12px;
	border-top: 1px solid var(--border-subtle);
}

.card__input {
	width: 160px;
}

.card__default {
	font: var(--type-body-sm);
	color: var(--text-subtle);
}

.card__spacer {
	flex: 1;
}

.note {
	font: var(--type-body-sm);
	color: var(--text-muted);
}
</style>
