<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { type HttpErrorResponse } from '../../../api-facade/http'
import { useFeatureUserStore } from '../../../stores/feature/featureUserStore'

const userStore = useFeatureUserStore()

const showModal = ref(false)
const newName = ref('')
const errorMessage = ref<string>()

const nameInput = useTemplateRef('nameInput')

const isLoading = computed(() => userStore.setDisplayState.isLoading)

const closeModal = () => {
	showModal.value = false
	newName.value = ''
	errorMessage.value = undefined
}

const onEditButtonClick = async () => {
	newName.value = userStore.currentUser.displayName ?? ''
	errorMessage.value = undefined
	showModal.value = true

	await nextTick()

	nameInput.value?.focus()
}

const onFormSubmit = () => {
	if (isLoading.value) {
		return
	}

	errorMessage.value = undefined

	const trimmedName = newName.value.trim()

	if (trimmedName === userStore.currentUser.displayName) {
		closeModal()
		return
	}

	if (!trimmedName) {
		errorMessage.value = 'Обязательное поле'
		return
	}

	if (trimmedName.length > 70) {
		errorMessage.value = 'Максимальная длина - 70 символов'
		return
	}

	userStore.setDisplayName(trimmedName)
		.then(() => {
			closeModal()
		})
		.catch((error: HttpErrorResponse) => {
			errorMessage.value = error.body?.message ?? 'Не удалось изменить имя'
		})
}
</script>

<template>
	<div class="display-name-form">
		<button class="edit-button" @click="onEditButtonClick">✏️</button>

		<Teleport to="body">
			<div v-if="showModal" class="modal-overlay" @click.self="closeModal">
				<form class="modal" @submit.prevent="onFormSubmit">
					<h2 class="modal-title">Изменить отображаемое имя</h2>

					<input
						class="name-input"
						ref="nameInput"
						:placeholder="userStore.currentUser.login"
						:disabled="isLoading"
						v-model="newName"
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
.display-name-form {
	display: inline-flex;
	vertical-align: middle;
	margin-left: 8px;
}

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

.name-input {
	border-radius: 6px;
	border: 1px solid var(--color-border-strong);
	background-color: var(--color-hover-bg);
	padding: 4px 8px;
}

.error {
	padding: 4px 8px;
	border-radius: 6px;
	background-color: var(--color-danger-bg);
	font-size: 0.8125rem;
	color: var(--color-danger-text);
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
