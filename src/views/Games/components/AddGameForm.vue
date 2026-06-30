<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, useTemplateRef, watchEffect } from 'vue'
import { useFeatureGameStore } from '../../../stores/feature/featureGameStore'

const gameStore = useFeatureGameStore()
const { wishlist, getWishlistState } = storeToRefs(gameStore)

const gameName = ref('')
const addGameInput = useTemplateRef('add-game-input')

const isLoading = computed(() => getWishlistState.value.isLoading)

const validator = computed(() => {
	const result: { ok: boolean; message?: string } = { ok: true }

	if (wishlist.value.find((u) => u.name === gameName.value)) {
		result.ok = false
		result.message = 'Такая игра уже есть'
	}

	return result
})

watchEffect(() => {
	addGameInput.value?.setCustomValidity(
		validator.value.ok ? '' : (validator.value.message ?? 'Неверные данные'),
	)
	addGameInput.value?.reportValidity()
})

const onAddGameFormSubmit = () => {
	if (!validator.value.ok) return
	if (!gameName.value.length) return

	gameStore.addToWishlist({ name: gameName.value }).then(() => {
		gameName.value = ''
	})
}
</script>

<template>
	<form class="form" @submit.prevent="onAddGameFormSubmit">
		<input
			class="game-input"
			ref="add-game-input"
			placeholder="Название игры..."
			:disabled="isLoading"
			v-model.trim="gameName"
		/>

		<button class="submit-button" :disabled="isLoading">Добавить</button>
	</form>
</template>

<style scoped>
.form {
	display: flex;
	gap: 16px;
}

.game-input {
	width: 320px;
	border-radius: 6px;
	border: 1px solid #cbd5e1;
	background-color: #f1f5f9;
	padding: 4px 12px;
}

.submit-button {
	cursor: pointer;
	background-color: #f1f5f9;
	padding: 4px 16px;
}

.submit-button:hover {
	background-color: #e2e8f0;
}

.submit-button:disabled {
	color: #64748b;
}
</style>
