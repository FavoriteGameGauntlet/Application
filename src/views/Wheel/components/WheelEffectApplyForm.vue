<script setup lang="ts">
import { computed, ref } from 'vue'
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

type OtherPlayerRow = {
	id: number
	login: string | null
	pointChange: number
	rollChange: number
}

const currentPointChange = ref(0)
const currentRollChange = ref(0)
const otherRows = ref<OtherPlayerRow[]>([])
const errorMessage = ref<string>()

let nextRowId = 0

const otherUsers = computed(() =>
	(wheelStore.users ?? []).filter((user) => user.login !== authStore.login),
)

const availableLoginsForRow = (row: OtherPlayerRow) =>
	otherUsers.value.filter(
		(user) =>
			user.login === row.login ||
			!otherRows.value.some(
				(other) => other !== row && other.login === user.login,
			),
	)

const addOtherRow = () => {
	otherRows.value.push({
		id: nextRowId++,
		login: null,
		pointChange: 0,
		rollChange: 0,
	})
}

const removeOtherRow = (id: number) => {
	otherRows.value = otherRows.value.filter((row) => row.id !== id)
}

const clamp = (value: number) => Math.min(100, Math.max(-100, value))
const clampRoll = (value: number) => Math.min(100, Math.max(0, value))

const parseInputValue = (event: Event) => {
	const raw = Number((event.target as HTMLInputElement).value)
	return isNaN(raw) ? 0 : raw
}

const onCurrentPointInput = (event: Event) => {
	currentPointChange.value = clamp(parseInputValue(event))
}

const onCurrentRollInput = (event: Event) => {
	currentRollChange.value = clampRoll(parseInputValue(event))
}

const onOtherPointInput = (row: OtherPlayerRow, event: Event) => {
	row.pointChange = clamp(parseInputValue(event))
}

const onOtherRollInput = (row: OtherPlayerRow, event: Event) => {
	row.rollChange = clampRoll(parseInputValue(event))
}

const buildChange = (
	login: string,
	pointChange: number,
	rollChange: number,
): WheelEffectPointChange | null => {
	if (!pointChange && !rollChange) return null

	return {
		login,
		...(pointChange && {
			freePointChange: {
				changeSource: FreePointChangeSource.WheelEffect,
				desiredChangeValue: pointChange,
			},
		}),
		...(rollChange && {
			availableRollChange: {
				changeSource: FreePointChangeSource.WheelEffect,
				desiredChangeValue: rollChange,
			},
		}),
	}
}

const submitApply = async () => {
	errorMessage.value = undefined

	const changes: WheelEffectPointChange[] = []

	if (authStore.login) {
		const change = buildChange(
			authStore.login,
			currentPointChange.value,
			currentRollChange.value,
		)
		if (change) changes.push(change)
	}

	for (const row of otherRows.value) {
		if (!row.login) continue

		const change = buildChange(row.login, row.pointChange, row.rollChange)
		if (change) changes.push(change)
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
			<span class="row-action"></span>
		</div>

		<div class="user-row">
			<span class="user-name">{{
				userStore.currentUser.displayName ?? userStore.currentUser.login
			}}</span>
			<input
				class="point-input"
				type="number"
				min="-100"
				max="100"
				title="Очки"
				:value="currentPointChange"
				@input="onCurrentPointInput"
			/>
			<input
				class="point-input"
				type="number"
				min="0"
				max="100"
				title="Прокруты"
				:value="currentRollChange"
				@input="onCurrentRollInput"
			/>
			<span class="row-action"></span>
		</div>

		<div v-for="row in otherRows" :key="row.id" class="user-row">
			<select class="user-select" v-model="row.login">
				<option :value="null" disabled>Выберите игрока</option>
				<option
					v-for="user in availableLoginsForRow(row)"
					:key="user.login"
					:value="user.login"
				>
					{{ user.displayName ?? user.login }}
				</option>
			</select>
			<input
				class="point-input"
				type="number"
				min="-100"
				max="100"
				title="Очки"
				:value="row.pointChange"
				@input="onOtherPointInput(row, $event)"
			/>
			<input
				class="point-input"
				type="number"
				min="0"
				max="100"
				title="Прокруты"
				:value="row.rollChange"
				@input="onOtherRollInput(row, $event)"
			/>
			<button
				class="row-action remove-row-button"
				type="button"
				@click="removeOtherRow(row.id)"
			>
				✕
			</button>
		</div>
	</div>

	<button
		class="modal-button add-row-button"
		type="button"
		:disabled="otherRows.length >= otherUsers.length"
		@click="addOtherRow"
	>
		+ Добавить игрока
	</button>

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

.add-row-button {
	align-self: flex-start;
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
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.user-select {
	flex: 1;
	min-width: 0;
	border-radius: 4px;
	border: 1px solid #cbd5e1;
	background-color: #fff;
	padding: 4px 8px;
}

.point-input {
	width: 72px;
	padding: 4px 8px;
	border: 1px solid #cbd5e1;
	border-radius: 4px;
	text-align: right;
}

.row-action {
	width: 20px;
	text-align: center;
}

.remove-row-button {
	border: none;
	background: transparent;
	cursor: pointer;
	color: #64748b;
	font-size: 0.875rem;
	padding: 0;
}

.remove-row-button:hover {
	color: #ef4444;
}
</style>
