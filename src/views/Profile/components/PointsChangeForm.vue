<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { type HttpErrorResponse } from '../../../api-facade/http'
import type { PointsChangeConfig } from './pointsChangeConfigs'

const props = defineProps<{ config: PointsChangeConfig }>()

const showModal = ref(false)
const reason = ref(props.config.reasons[0].value)
const sliceIndex = ref<number | null>(null)
const applyTarget = ref(false)
const targetLogin = ref<string | null>(null)
const amount = ref<number | null>(null)
const errorMessage = ref<string>()

const selectedReason = computed(
	() =>
		props.config.reasons.find((option) => option.value === reason.value) ??
		props.config.reasons[0],
)

const isSliceBased = computed(() => !!selectedReason.value.sliceValues)
const target = computed(() => selectedReason.value.target)

const sliceDisplayValues = computed(
	() => selectedReason.value.sliceValues?.(applyTarget.value) ?? [],
)

const fixedValue = computed(() => selectedReason.value.fixedValue?.() ?? null)

const isLoading = computed(() => props.config.isLoading())

const syncFieldsForReason = () => {
	amount.value = null
	applyTarget.value = false
	targetLogin.value = null
	errorMessage.value = undefined
	sliceIndex.value = isSliceBased.value && sliceDisplayValues.value.length ? 0 : null
}

const resetForm = () => {
	reason.value = props.config.reasons[0].value
	syncFieldsForReason()
}

watch(reason, syncFieldsForReason)

watch(applyTarget, (value) => {
	target.value?.onToggle?.(value)
	if (!value) targetLogin.value = null
})

watch(targetLogin, () => {
	errorMessage.value = undefined
})

const closeModal = () => {
	showModal.value = false
	resetForm()
}

const onEditButtonClick = () => {
	resetForm()
	showModal.value = true
}

const onAmountInput = (event: Event) => {
	amount.value = (event.target as HTMLInputElement).valueAsNumber || null
}

const onFormSubmit = () => {
	if (isLoading.value) return

	errorMessage.value = undefined

	const desiredChangeValue = isSliceBased.value
		? sliceIndex.value !== null
			? (sliceDisplayValues.value[sliceIndex.value] ?? null)
			: null
		: (fixedValue.value ?? amount.value)

	if (!desiredChangeValue) return
	if (target.value && applyTarget.value && !targetLogin.value) return

	const payload = {
		reason: reason.value,
		desiredChangeValue,
		isSomeones: applyTarget.value,
		targetLogin: targetLogin.value,
	}

	const request = props.config.submit(payload)

	if (!request) return

	request
		.then(() => {
			closeModal()
		})
		.catch((error: HttpErrorResponse) => {
			const message = props.config.mapError?.(error, payload)
			if (message) {
				errorMessage.value = message
				return
			}
			throw error
		})
}
</script>

<template>
	<div class="points-change-form">
		<button class="edit-button" @click="onEditButtonClick">✏️</button>

		<Teleport to="body">
			<div v-if="showModal" class="modal-overlay" @click.self="closeModal">
				<form class="modal" @submit.prevent="onFormSubmit">
					<h2 class="modal-title">{{ config.title }}</h2>

					<select class="reason-select" :disabled="isLoading" v-model="reason">
						<option
							v-for="option in config.reasons"
							:key="option.value"
							:value="option.value"
						>
							{{ option.label }}
						</option>
					</select>

					<div class="warning" v-if="selectedReason.warning">
						{{ selectedReason.warning }}
					</div>

					<select
						v-if="isSliceBased"
						class="amount-input"
						:disabled="isLoading"
						v-model.number="sliceIndex"
					>
						<option
							v-for="(value, index) in sliceDisplayValues"
							:key="index"
							:value="index"
						>
							{{ value }}
						</option>
					</select>

					<input
						v-else
						class="amount-input"
						type="number"
						placeholder="Количество"
						:disabled="isLoading || fixedValue !== null"
						:value="fixedValue ?? amount"
						@input="onAmountInput"
					/>

					<template v-if="target">
						<label class="penalty-checkbox">
							<input type="checkbox" :disabled="isLoading" v-model="applyTarget" />
							{{ target.checkboxLabel }}
						</label>

						<select
							v-if="applyTarget"
							class="reason-select"
							:disabled="isLoading"
							v-model="targetLogin"
						>
							<option :value="null" disabled>Выберите игрока</option>
							<option
								v-for="user in target.options()"
								:key="user.login"
								:value="user.login"
							>
								{{ user.label }}
							</option>
						</select>
					</template>

					<div class="error" v-if="errorMessage">{{ errorMessage }}</div>

					<div class="modal-actions">
						<button
							class="modal-button modal-button--primary"
							:disabled="isLoading"
						>
							Подтвердить
						</button>
						<button
							class="modal-button"
							type="button"
							:disabled="isLoading"
							@click="closeModal"
						>
							Отмена
						</button>
					</div>
				</form>
			</div>
		</Teleport>
	</div>
</template>

<style scoped>
.edit-button {
	cursor: pointer;
}

.modal-overlay {
	position: fixed;
	inset: 0;
	background-color: rgba(0, 0, 0, 0.4);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 100;
}

.modal {
	background: var(--color-surface);
	border-radius: 8px;
	padding: 24px;
	max-width: 400px;
	width: 90%;
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.modal-title {
	font-size: 1.25rem;
	font-weight: 600;
}

.reason-select,
.amount-input {
	border-radius: 6px;
	border: 1px solid var(--color-border-strong);
	background-color: var(--color-hover-bg);
	padding: 4px 8px;
}

.penalty-checkbox {
	display: flex;
	align-items: center;
	gap: 6px;
	cursor: pointer;
}

.error {
	padding: 4px 8px;
	border-radius: 6px;
	background-color: var(--color-danger-bg);
	font-size: 0.8125rem;
	color: var(--color-danger-text);
}

.warning {
	padding: 4px 8px;
	border-radius: 6px;
	background-color: var(--color-warning-bg);
	font-size: 0.8125rem;
	color: var(--color-warning-text);
}

.modal-actions {
	display: flex;
	gap: 8px;
	justify-content: flex-end;
}

.modal-button {
	padding: 6px 16px;
	border: 1px solid var(--color-muted);
	border-radius: 4px;
	cursor: pointer;
	background: transparent;
}

.modal-button:hover:not(:disabled) {
	background-color: var(--color-hover-bg);
}

.modal-button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.modal-button--primary {
	background-color: var(--color-accent);
	border-color: var(--color-accent);
	color: var(--color-on-accent);
}

.modal-button--primary:hover:not(:disabled) {
	background-color: var(--color-accent-hover);
}
</style>
