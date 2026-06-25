<script setup lang="ts">
import UiButton from '../../components/ui/UiButton.vue'
import { useFeatureWheelStore } from '../../stores/feature/featureWheelStore'
import { computed, onMounted, ref } from 'vue'
import { funnyEffects } from './constants/funnyEffects'
import UiView from '../../components/ui/UiView.vue'
import type { RolledWheelEffectDto } from '../../api-facade/models/wheel-effects-models'
import type { Login } from '../../api-facade/models/users-models'
import { FreePointChangeSource } from '../../api-facade/models/points-models'
import { api } from '../../api-facade/api'

const wheelStore = useFeatureWheelStore()

const getRandomNumber = (min: number, max: number) => {
	return Math.floor(Math.random() * (max - min) + min)
}

const getRandomItems = <T,>(collection: T[], count: number = 1): T[] => {
	const randomizedCollection: T[] = []

	for (let i = 0; i < count && i < collection.length; i++) {
		const index = getRandomNumber(0, collection.length)
		randomizedCollection.push(collection.at(index)!)
	}

	return randomizedCollection
}

const visibleEffects = computed(() => {
	if (wheelStore.currentEffects) {
		return [...wheelStore.currentEffects].sort(
			(a, b) => a.position - b.position,
		)
	}

	return getRandomItems(funnyEffects, 5)
})

const onRollButtonClick = () => {
	wheelStore.roll()
}

const selectedEffect = ref<RolledWheelEffectDto | null>(null)
const showApplyForm = ref(false)
const players = ref<Login[]>([])
const pointChanges = ref<Record<string, number>>({})
const applying = ref(false)

const closeModal = () => {
	selectedEffect.value = null
	showApplyForm.value = false
}

const openApplyForm = async () => {
	if (!players.value.length) {
		players.value = await api.users.getAllNames()
		pointChanges.value = Object.fromEntries(
			players.value.map((p) => [p.login, 0]),
		)
	}
	showApplyForm.value = true
}

const clamp = (value: number) => Math.min(100, Math.max(-100, value))

const onPointInput = (login: string, event: Event) => {
	const raw = Number((event.target as HTMLInputElement).value)
	pointChanges.value[login] = clamp(isNaN(raw) ? 0 : raw)
}

const submitApply = async () => {
	if (!selectedEffect.value) return

	const changes = Object.entries(pointChanges.value)
		.filter(([, value]) => value !== 0)
		.map(([login, desiredChangeValue]) => ({
			login,
			pointChange: {
				changeSource: FreePointChangeSource.WheelEffect,
				desiredChangeValue,
			},
		}))

	applying.value = true
	try {
		await api.wheelEffects.postApplyRoll({
			body: {
				wheelEffectName: selectedEffect.value.name,
				pointChanges: changes,
			},
		})
		selectedEffect.value.isApplied = true
		showApplyForm.value = false
	} finally {
		applying.value = false
	}
}

onMounted(() => {
	wheelStore.getLastRoll()
	wheelStore.getAvailableEffects()
})
</script>

<template>
	<UiView>
		<div class="wheel-rolls-view">
			<h1 class="title">Роллы</h1>

			<div class="effects-grid">
				<div
					class="effect-card"
					:key="effect.name"
					v-for="effect in visibleEffects"
					@click="selectedEffect = effect"
				>
					<span class="effect-name">{{ effect.name }}</span>
					<label class="effect-applied" @click.stop>
						<input type="checkbox" :checked="effect.isApplied" disabled />
						Применён
					</label>
				</div>
			</div>

			<UiButton class="roll-button" @click="onRollButtonClick">
				Прокрутить
			</UiButton>
		</div>

		<Teleport to="body">
			<div v-if="selectedEffect" class="modal-overlay" @click.self="closeModal">
				<div class="modal">
					<template v-if="!showApplyForm">
						<h2 class="modal-title">{{ selectedEffect.name }}</h2>
						<p v-if="selectedEffect.description" class="modal-description">
							{{ selectedEffect.description }}
						</p>
						<p v-else class="modal-empty">Описание отсутствует</p>
						<label class="effect-applied">
							<input
								type="checkbox"
								:checked="selectedEffect.isApplied"
								disabled
							/>
							Применён
						</label>
						<div class="modal-actions">
							<button
								v-if="!selectedEffect.isApplied"
								class="modal-button modal-button--primary"
								@click="openApplyForm"
							>
								Применить
							</button>
							<button class="modal-button" @click="closeModal">Закрыть</button>
						</div>
					</template>

					<template v-else>
						<h2 class="modal-title">Применить: {{ selectedEffect.name }}</h2>
						<div class="players-list">
							<div
								v-for="player in players"
								:key="player.login"
								class="player-row"
							>
								<span class="player-name">{{
									player.displayName ?? player.login
								}}</span>
								<input
									class="point-input"
									type="number"
									min="-100"
									max="100"
									:value="pointChanges[player.login]"
									@input="onPointInput(player.login, $event)"
								/>
							</div>
						</div>
						<div class="modal-actions">
							<button
								class="modal-button modal-button--primary"
								:disabled="applying"
								@click="submitApply"
							>
								Подтвердить
							</button>
							<button class="modal-button" @click="showApplyForm = false">
								Назад
							</button>
						</div>
					</template>
				</div>
			</div>
		</Teleport>
	</UiView>
</template>

<style scoped>
.wheel-rolls-view {
	display: grid;
	height: 100%;
	place-content: center;
	gap: 48px;
}

.nav-link {
	place-self: center;
	color: #3b82f6;
}

.nav-link:hover {
	text-decoration: underline;
}

.title {
	text-align: center;
	font-size: 2.25rem;
	font-weight: 600;
}

.effects-grid {
	display: flex;
	gap: 16px;
	border: 1px solid #e2e8f0;
}

.effect-card {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 8px;
	height: 160px;
	width: 120px;
	border: 1px solid #64748b;
	overflow: hidden;
	cursor: pointer;
}

.effect-card:hover {
	background-color: #f8fafc;
}

.effect-name {
	font-weight: 600;
}

.effect-applied {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 0.75rem;
	color: #64748b;
	margin-top: auto;
	cursor: default;
}

.roll-button {
	height: 56px;
	width: 224px;
	justify-self: center;
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

.modal-description {
	color: #334155;
	line-height: 1.6;
}

.modal-empty {
	color: #94a3b8;
	font-style: italic;
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

.players-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
	max-height: 300px;
	overflow-y: auto;
}

.player-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

.player-name {
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
