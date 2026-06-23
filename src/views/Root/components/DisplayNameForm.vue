<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { LoadingStatus } from '../../../utils/loadingState'
import { useFeatureUserStore } from '../../../stores/feature/featureUserStore'

const userStore = useFeatureUserStore()

const showForm = ref(false)
const newName = ref<string | null>(null)
const mirrorText = ref('')

const nameInput = useTemplateRef('nameInput')

const displayName = computed(
	() => userStore.currentUser.displayName ?? userStore.currentUser.login,
)

const isLoading = computed(
	() => userStore.setDisplayState.state === LoadingStatus.LOADING,
)

watch(newName, (newName) => {
	mirrorText.value = newName ?? userStore.currentUser.login ?? ''
})

const closeForm = () => {
	showForm.value = false
	newName.value = null
}

const onEditButtonClick = async () => {
	showForm.value = true
	newName.value = userStore.currentUser.displayName ?? ''

	await nextTick()

	nameInput.value?.focus()
}

const onFormSubmit = () => {
	let trimmedName = newName.value?.trim()

	if (!trimmedName || isLoading.value) {
		return
	}

	if (trimmedName === userStore.currentUser.displayName) {
		closeForm()
		return
	}

	if (trimmedName.length < 1) {
		throw new Error('Display name validation error')
	}

	if (trimmedName.length > 70) {
		trimmedName = trimmedName.slice(0, 70)
	}

	userStore.setDisplayName(trimmedName).then(() => {
		showForm.value = false
	})
}

const onCancelButtonClick = () => {
	closeForm()
}

const onEscKeyDown = () => {
	closeForm()
}
</script>

<template>
	<div>
		<button
			class="edit-button"
			v-if="!showForm"
			:disabled="userStore.getDisplayNameState.state === LoadingStatus.LOADING"
			@click="onEditButtonClick"
		>
			{{ displayName }} <span class="pencil-icon">✏️</span>
		</button>

		<form class="name-form" v-else @submit.prevent="onFormSubmit">
			<div class="resize-container">
				<span class="resize-text">{{ mirrorText }}</span>

				<input
					class="name-input"
					ref="nameInput"
					:placeholder="userStore.currentUser.login"
					:disabled="isLoading"
					@keydown.esc="onEscKeyDown"
					v-model="newName"
				/>
			</div>

			<button class="icon-button" :disabled="isLoading">✅</button>

			<button
				class="icon-button"
				type="button"
				:disabled="isLoading"
				@click="onCancelButtonClick"
			>
				❌
			</button>
		</form>
	</div>
</template>

<style scoped>
.icon-button,
.edit-button {
	cursor: pointer;
}

.pencil-icon {
	opacity: 0;
}

.edit-button:not([disabled]):where(:hover, :focus-visible) .pencil-icon {
	opacity: 1;
}

.name-form {
	display: flex;
	gap: 8px;
}

.resize-container {
	display: inline-block;
	position: relative;
}

.resize-text,
.name-input {
	font: inherit;
	padding: 0;
	margin: 0;
}

.resize-text {
	display: inline-block;
	visibility: hidden;
	white-space: pre;
}

.name-input {
	position: absolute;
	inset: 0;
	width: 100%;
}

.name-input:focus-visible {
	outline: none;
}
</style>
