<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { type HttpErrorResponse } from '../../../api-facade/http'
import {
	TerritoryHourChangeSource,
	territoryHourChangeSourceLabel,
} from '../../../api-facade/models/points-models'
import { useFeatureSystemParametersStore } from '../../../stores/feature/featureSystemParametersStore'
import { useFeatureUserStore } from '../../../stores/feature/featureUserStore'

const userStore = useFeatureUserStore()
const systemParametersStore = useFeatureSystemParametersStore()

const showModal = ref(false)
const reason = ref<TerritoryHourChangeSource>(TerritoryHourChangeSource.Seize)
const seizeSliceIndex = ref<number | null>(null)
const applyPenalty = ref(false)
const targetLogin = ref<string | null>(null)
const amount = ref<number | null>(null)
const errorMessage = ref<string>()

const isSeize = computed(
	() => reason.value === TerritoryHourChangeSource.Seize,
)

const isLoading = computed(
	() => userStore.changeTerritoryHoursState.isLoading,
)

const seizeSliceDisplayValues = computed(() =>
	systemParametersStore.territoryHourChangeBySeizeSlice.map((value) =>
		applyPenalty.value
			? value + systemParametersStore.seizePenaltyPoints
			: value,
	),
)

watch(reason, (value) => {
	if (value === TerritoryHourChangeSource.Seize) {
		seizeSliceIndex.value = systemParametersStore.territoryHourChangeBySeizeSlice
			.length
			? 0
			: null
	} else {
		amount.value = null
		applyPenalty.value = false
	}
})

watch(applyPenalty, (value) => {
	if (value) {
		if (!userStore.users) userStore.getAllUsers()
	} else {
		targetLogin.value = null
	}
})

watch(targetLogin, () => {
	errorMessage.value = undefined
})

const closeModal = () => {
	showModal.value = false
	reason.value = TerritoryHourChangeSource.Seize
	seizeSliceIndex.value = null
	applyPenalty.value = false
	targetLogin.value = null
	amount.value = null
	errorMessage.value = undefined
}

const onEditButtonClick = () => {
	seizeSliceIndex.value = systemParametersStore.territoryHourChangeBySeizeSlice
		.length
		? 0
		: null
	showModal.value = true
}

const onFormSubmit = () => {
	if (isLoading.value) return

	errorMessage.value = undefined

	const desiredChangeValue = isSeize.value
		? seizeSliceIndex.value !== null
			? (seizeSliceDisplayValues.value[seizeSliceIndex.value] ?? null)
			: null
		: amount.value

	if (!desiredChangeValue) return
	if (applyPenalty.value && !targetLogin.value) return

	userStore
		.changeTerritoryHours({
			changeSource: reason.value,
			desiredChangeValue,
			isSomeones: applyPenalty.value,
			...(applyPenalty.value && targetLogin.value
				? { login: targetLogin.value }
				: {}),
		})
		.then(() => {
			closeModal()
		})
		.catch((error: HttpErrorResponse) => {
			if (error.body?.code === 'NOT_ENOUGH_CURRENT_POINTS') {
				errorMessage.value =
					'У выбранного игрока недостаточно очков территорий. Выберите другого игрока.'
				return
			}
			throw error
		})
}
</script>

<template>
	<div class="territory-hours-form">
		<button class="edit-button" @click="onEditButtonClick">✏️</button>

		<Teleport to="body">
			<div v-if="showModal" class="modal-overlay" @click.self="closeModal">
				<form class="modal" @submit.prevent="onFormSubmit">
					<h2 class="modal-title">Изменить часы территории</h2>

					<select class="reason-select" :disabled="isLoading" v-model="reason">
						<option
							v-for="(label, key) in territoryHourChangeSourceLabel"
							:key="key"
							:value="key"
						>
							{{ label }}
						</option>
					</select>

					<template v-if="isSeize">
						<select
							class="amount-input"
							:disabled="isLoading"
							v-model.number="seizeSliceIndex"
						>
							<option
								v-for="(value, index) in seizeSliceDisplayValues"
								:key="index"
								:value="index"
							>
								{{ value }}
							</option>
						</select>

						<label class="penalty-checkbox">
							<input
								type="checkbox"
								:disabled="isLoading"
								v-model="applyPenalty"
							/>
							Чужая территория
						</label>

						<select
							v-if="applyPenalty"
							class="reason-select"
							:disabled="isLoading"
							v-model="targetLogin"
						>
							<option :value="null" disabled>Выберите игрока</option>
							<option
								v-for="user in userStore.otherUsers"
								:key="user.login"
								:value="user.login"
							>
								{{ user.displayName ?? user.login }}
							</option>
						</select>
					</template>

					<input
						v-else
						class="amount-input"
						type="number"
						placeholder="Количество"
						:disabled="isLoading"
						v-model.number="amount"
					/>

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
	background: #fff;
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
	border: 1px solid #cbd5e1;
	background-color: #f1f5f9;
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
	background-color: #fef2f2;
	font-size: 0.8125rem;
	color: #291e1c;
}

.modal-actions {
	display: flex;
	gap: 8px;
	justify-content: flex-end;
}

.modal-button {
	padding: 6px 16px;
	border: 1px solid #64748b;
	border-radius: 4px;
	cursor: pointer;
	background: transparent;
}

.modal-button:hover:not(:disabled) {
	background-color: #f1f5f9;
}

.modal-button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.modal-button--primary {
	background-color: #3b82f6;
	border-color: #3b82f6;
	color: #fff;
}

.modal-button--primary:hover:not(:disabled) {
	background-color: #2563eb;
}
</style>
