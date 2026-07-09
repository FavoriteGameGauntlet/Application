<script setup lang="ts">
import { ref } from 'vue'
import type { HttpErrorResponse } from '../../../api-facade/http'
import { FreePointChangeSource } from '../../../api-facade/models/points-models'
import type {
	RolledWheelEffectDto,
	WheelEffectPointChange,
} from '../../../api-facade/models/wheel-effects-models'
import { useAuthStore } from '../../../stores/authStore'
import { useFeatureUserStore } from '../../../stores/feature/featureUserStore'
import { useFeatureWheelStore } from '../../../stores/feature/featureWheelStore'

const props = defineProps<{
	effect: RolledWheelEffectDto
}>()

const emit = defineEmits<{
	close: []
}>()

const wheelStore = useFeatureWheelStore()
const authStore = useAuthStore()
const userStore = useFeatureUserStore()

const pointChanges = ref<Record<string, number>>(
	Object.fromEntries((wheelStore.users ?? []).map((user) => [user.login, 0])),
)
const rollChanges = ref<Record<string, number>>(
	Object.fromEntries((wheelStore.users ?? []).map((user) => [user.login, 0])),
)
const errorMessage = ref<string>()

const clamp = (value: number) => Math.min(100, Math.max(-100, value))
const clampRoll = (value: number) => Math.min(100, Math.max(0, value))

const onPointInput = (login: string, event: Event) => {
	const raw = Number((event.target as HTMLInputElement).value)
	pointChanges.value[login] = clamp(isNaN(raw) ? 0 : raw)
}

const onRollInput = (login: string, event: Event) => {
	const raw = Number((event.target as HTMLInputElement).value)
	rollChanges.value[login] = clampRoll(isNaN(raw) ? 0 : raw)
}

const submitApply = async () => {
	errorMessage.value = undefined

	const logins = new Set([
		...Object.keys(pointChanges.value),
		...Object.keys(rollChanges.value),
	])

	const changes: WheelEffectPointChange[] = []

	for (const login of logins) {
		const desiredPointChangeValue = pointChanges.value[login]
		const desiredRollChangeValue = rollChanges.value[login]

		if (!desiredPointChangeValue && !desiredRollChangeValue) continue

		const change: WheelEffectPointChange = { login }

		if (desiredPointChangeValue) {
			change.freePointChange = {
				changeSource: FreePointChangeSource.WheelEffect,
				desiredChangeValue: desiredPointChangeValue,
			}
		}

		if (desiredRollChangeValue) {
			change.availableRollChange = {
				changeSource: FreePointChangeSource.WheelEffect,
				desiredChangeValue: desiredRollChangeValue,
			}
		}

		changes.push(change)
	}

	await wheelStore
		.applyRoll(props.effect.name, changes)
		.then(async () => {
			if (authStore.login) await userStore.getUserEffects(authStore.login)
			emit('close')
		})
		.catch((error: HttpErrorResponse) => {
			if (error.body?.code === 'INCORRECT_CHANGE_SOURCE_VALUE') {
				errorMessage.value = 'Значение перекрутов должно быть 0 или больше.'
				return
			}
			throw error
		})
}
</script>

<template>
	<h2 class="modal-title">Применить: {{ effect.name }}</h2>
	<div class="users-list">
		<div class="user-row user-row--header">
			<span class="user-name"></span>
			<span class="point-input">Очки</span>
			<span class="point-input">Прокруты</span>
		</div>
		<div v-for="user in wheelStore.users" :key="user.login" class="user-row">
			<span class="user-name">{{ user.displayName ?? user.login }}</span>
			<input
				class="point-input"
				type="number"
				min="-100"
				max="100"
				title="Очки"
				:value="pointChanges[user.login]"
				@input="onPointInput(user.login, $event)"
			/>
			<input
				class="point-input"
				type="number"
				min="0"
				max="100"
				title="Прокруты"
				:value="rollChanges[user.login]"
				@input="onRollInput(user.login, $event)"
			/>
		</div>
	</div>
	<div class="error" v-if="errorMessage">{{ errorMessage }}</div>
	<div class="modal-actions">
		<button
			class="modal-button modal-button--primary"
			:disabled="wheelStore.applyRollState.isLoading"
			@click="submitApply"
		>
			Подтвердить
		</button>
		<button class="modal-button" @click="emit('close')">Назад</button>
	</div>
</template>

<style scoped>
.modal-title {
	font-size: 1.25rem;
	font-weight: 600;
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

.users-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
	max-height: 300px;
	overflow-y: auto;
}

.error {
	padding: 4px 8px;
	border-radius: 6px;
	background-color: #fef2f2;
	font-size: 0.8125rem;
	color: #291e1c;
}

.user-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

.user-row--header .point-input {
	border: none;
	padding: 0;
	text-align: center;
	font-size: 0.75rem;
	color: #64748b;
}

.user-name {
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.point-input {
	width: 72px;
	padding: 4px 8px;
	border: 1px solid #cbd5e1;
	border-radius: 4px;
	text-align: right;
}
</style>
