<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import type { SystemParameter } from '../../api-facade/contracts'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiInput from '../../components/ui/UiInput.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import { useAdminParametersStore } from '../../stores/adminParametersStore'
import { useToastStore } from '../../stores/toastStore'

type Description = {
	label: string
	hint: string
	/** the text of what is wrong with the value, or nothing */
	check: (value: number) => string | undefined
}

/** the backend gives the names only, the texts are here; an unknown parameter shows its name */
const descriptions: Record<string, Description> = {
	TimerDurationInS: {
		label: 'Длительность таймера',
		hint: 'В секундах. Действует на следующие таймеры, идущий не меняется.',
		check: (n) => (n < 1 ? 'Не меньше секунды.' : undefined),
	},
	MinimumNumberOfWishlistGames: {
		label: 'Игр в списке желаемого, чтобы крутить его',
		hint: 'Минимум игр в списке желаемого игрока.',
		check: (n) => (n < 0 ? 'Не меньше нуля.' : undefined),
	},
	MinimumAvailableWheelEffectsForRoll: {
		label: 'Пунктов на колесе за прокрут',
		hint: 'Сколько пунктов показывает один прокрут. Нечётное число: у колеса есть центральный пункт.',
		check: (n) => (n < 1 || n % 2 === 0 ? 'Нечётное число, от 1.' : undefined),
	},
}

const store = useAdminParametersStore()
const toastStore = useToastStore()

const draft = reactive<Record<string, string>>({})

const labelOf = (parameter: SystemParameter) =>
	descriptions[parameter.name]?.label ?? parameter.name

const syncDraft = () => {
	for (const parameter of store.parameters)
		draft[parameter.name] = parameter.value
}

const isChanged = (parameter: SystemParameter) =>
	(draft[parameter.name] ?? '').trim() !== parameter.value

const onSave = async (parameter: SystemParameter) => {
	const value = (draft[parameter.name] ?? '').trim()
	const number = Number(value)

	if (!value || !Number.isInteger(number)) {
		toastStore.show(
			'Не понял число',
			`${labelOf(parameter)}: нужно целое число.`,
			'danger',
		)
		return
	}

	const problem = descriptions[parameter.name]?.check(number)

	if (problem) {
		toastStore.show(
			'Проверь значение',
			`${labelOf(parameter)}: ${problem}`,
			'danger',
		)
		return
	}

	if (await store.save(parameter.name, String(number))) syncDraft()
}

const onReset = async (parameter: SystemParameter) => {
	if (await store.reset(parameter.name)) syncDraft()
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
			:key="parameter.name"
			class="card"
		>
			<div class="card__head">
				<span class="card__label">{{ labelOf(parameter) }}</span>
				<UiBadge v-if="!parameter.isDefault" tone="accent">изменено</UiBadge>
			</div>

			<span v-if="descriptions[parameter.name]" class="card__hint">
				{{ descriptions[parameter.name].hint }}
			</span>

			<div class="card__row">
				<div class="card__input">
					<UiInput
						v-model="draft[parameter.name]"
						inputmode="numeric"
						:aria-label="labelOf(parameter)"
						@keydown.enter="onSave(parameter)"
					/>
				</div>
				<span class="card__default"
					>по умолчанию: {{ parameter.defaultValue }}</span
				>
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
					:disabled="!isChanged(parameter)"
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
