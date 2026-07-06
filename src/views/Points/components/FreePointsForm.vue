<script setup lang="ts">
import { computed, ref } from 'vue'
import {
	FreePointChangeSource,
	freePointChangeSourceLabel,
} from '../../../api-facade/models/points-models'
import { useFeatureSystemParametersStore } from '../../../stores/feature/featureSystemParametersStore'
import { useFeatureUserStore } from '../../../stores/feature/featureUserStore'

const props = defineProps<{ login: string }>()

const userStore = useFeatureUserStore()
const systemParametersStore = useFeatureSystemParametersStore()

const reasonOptions = Object.values(FreePointChangeSource).filter(
	(source) => source !== FreePointChangeSource.WheelEffect,
)

const showModal = ref(false)
const reason = ref<FreePointChangeSource>(FreePointChangeSource.Quest)
const amount = ref<number | null>(null)

const isLoading = computed(() => userStore.changeFreePointsState.isLoading)

const fixedValue = computed<number | null>(() => {
	if (reason.value === FreePointChangeSource.BaseTeleport) {
		return systemParametersStore.freePointChangeByBaseTeleport
	}
	if (reason.value === FreePointChangeSource.Sandstorm) {
		return systemParametersStore.freePointChangeBySandstorm
	}
	return null
})

const closeModal = () => {
	showModal.value = false
	reason.value = FreePointChangeSource.Quest
	amount.value = null
}

const onEditButtonClick = () => {
	showModal.value = true
}

const onAmountInput = (event: Event) => {
	amount.value = (event.target as HTMLInputElement).valueAsNumber || null
}

const onFormSubmit = () => {
	if (isLoading.value) return

	const desiredChangeValue = fixedValue.value ?? amount.value

	if (!desiredChangeValue) return

	userStore
		.changeFreePoints(props.login, {
			changeSource: reason.value,
			desiredChangeValue,
		})
		.then(() => {
			closeModal()
		})
}
</script>

<template>
	<div class="free-points-form">
		<button class="edit-button" @click="onEditButtonClick">✏️</button>

		<Teleport to="body">
			<div v-if="showModal" class="modal-overlay" @click.self="closeModal">
				<form class="modal" @submit.prevent="onFormSubmit">
					<h2 class="modal-title">Изменить свободные очки</h2>

					<select class="reason-select" :disabled="isLoading" v-model="reason">
						<option
							v-for="source in reasonOptions"
							:key="source"
							:value="source"
						>
							{{ freePointChangeSourceLabel[source] }}
						</option>
					</select>

					<input
						class="amount-input"
						type="number"
						placeholder="Количество"
						:disabled="isLoading || fixedValue !== null"
						:value="fixedValue ?? amount"
						@input="onAmountInput"
					/>

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
