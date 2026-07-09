<script setup lang="ts">
import UiButton from '../../components/ui/UiButton.vue'
import { useFeatureWheelStore } from '../../stores/feature/featureWheelStore'
import { computed, onMounted, ref } from 'vue'
import { funnyEffects } from './constants/funnyEffects.ts'
import UiView from '../../components/ui/UiView.vue'
import WheelEffectApplyForm from './components/WheelEffectApplyForm.vue'
import type { RolledWheelEffectDto } from '../../api-facade/models/wheel-effects-models'
import { formatInstant } from '../../utils/temporal'
import { useAuthStore } from '../../stores/authStore'
import { useFeatureUserStore } from '../../stores/feature/featureUserStore'

const wheelStore = useFeatureWheelStore()
const authStore = useAuthStore()
const userStore = useFeatureUserStore()

const effectsHistory = computed(() =>
	authStore.login ? (userStore.userEffects[authStore.login] ?? []) : [],
)

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

const centerIndex = computed(() =>
	Math.floor((visibleEffects.value.length - 1) / 2),
)

const onRollButtonClick = () => {
	wheelStore.roll()
}

const selectedEffect = ref<RolledWheelEffectDto | null>(null)
const showApplyForm = ref(false)

const closeModal = () => {
	selectedEffect.value = null
	showApplyForm.value = false
}

onMounted(() => {
	wheelStore.getLastRoll()
	wheelStore.getAvailableEffects()
	wheelStore.getAllUsers()

	if (authStore.login) userStore.getUserEffects(authStore.login)
})
</script>

<template>
	<UiView>
		<div class="wheel">
			<div class="wheel-header">
				<h1>Колесо</h1>
				<span class="attempts-pill"
					>попыток: {{ wheelStore.availableRollCount }}</span
				>
			</div>

			<div class="reel">
				<div class="effects-grid">
					<div
						class="effect-card"
						:class="{ 'effect-card--center': i === centerIndex }"
						:key="effect.name"
						v-for="(effect, i) in visibleEffects"
						@click="selectedEffect = effect"
					>
						<span class="effect-name">{{ effect.name }}</span>
						<label class="effect-applied" @click.stop>
							<input type="checkbox" :checked="effect.isApplied" disabled />
							Применён
						</label>
					</div>
				</div>
				<div class="reel-pointer"></div>
			</div>

			<UiButton
				class="roll-button"
				:disabled="!wheelStore.availableRollCount"
				@click="onRollButtonClick"
			>
				Прокрутить
			</UiButton>

			<h2 class="history-title">История применённых эффектов</h2>
			<p v-if="userStore.getUserEffectsState.isLoading">Загрузка...</p>
			<p v-else-if="userStore.getUserEffectsState.isError">Ошибка загрузки</p>
			<template v-else-if="userStore.getUserEffectsState.isLoaded">
				<p v-if="!effectsHistory.length" class="empty-message">
					Нет истории эффектов
				</p>
				<ul v-else class="item-list">
					<li
						v-for="(effect, i) in effectsHistory"
						:key="i"
						class="info-card info-card--row"
					>
						<span class="item-title">{{ effect.name }}</span>
						<span class="item-meta">{{ formatInstant(effect.rollDate) }}</span>
					</li>
				</ul>
			</template>
		</div>

		<Teleport to="body">
			<div v-if="selectedEffect" class="modal-overlay" @click.self="closeModal">
				<div class="modal" :class="{ 'modal--wide': showApplyForm }">
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
								@click="showApplyForm = true"
							>
								Применить
							</button>
							<button class="modal-button" @click="closeModal">Закрыть</button>
						</div>
					</template>

					<WheelEffectApplyForm
						v-else
						:effect="selectedEffect"
						@close="showApplyForm = false"
					/>
				</div>
			</div>
		</Teleport>
	</UiView>
</template>

<style scoped>
.wheel {
	display: flex;
	flex-direction: column;
	gap: 20px;
	width: 100%;
}

.wheel-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.attempts-pill {
	border: 1px solid #e2e8f0;
	border-radius: 20px;
	padding: 5px 14px;
	font-size: 0.8125rem;
	color: #64748b;
}

.reel {
	position: relative;
	display: flex;
	padding: 16px 28px 16px 16px;
	border: 1px solid #e2e8f0;
}

.effects-grid {
	display: flex;
	flex-direction: column;
	gap: 8px;
	width: 100%;
}

.effect-card {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 10px 16px;
	border: 1px solid #64748b;
	cursor: pointer;
}

.effect-card:hover {
	background-color: #f8fafc;
}

.effect-card--center {
	border-width: 2px;
	border-color: #0f172a;
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
	cursor: default;
}

.reel-pointer {
	position: absolute;
	right: 8px;
	top: 50%;
	transform: translateY(-50%);
	width: 0;
	height: 0;
	border-top: 8px solid transparent;
	border-bottom: 8px solid transparent;
	border-right: 12px solid #64748b;
}

.roll-button {
	height: 56px;
	width: 224px;
	align-self: center;
}

.history-title {
	font-size: 0.875rem;
	color: #64748b;
	font-weight: 500;
}

.empty-message {
	color: #64748b;
}

.item-list {
	display: flex;
	flex-direction: column;
	gap: 6px;
	list-style: none;
	padding: 0;
	width: 100%;
}

.info-card {
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 12px 16px;
	border: 1px solid #e2e8f0;
	border-radius: 4px;
}

.info-card--row {
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
}

.item-title {
	font-weight: 500;
}

.item-meta {
	font-size: 0.875rem;
	color: #64748b;
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
	max-height: 85vh;
	display: flex;
	flex-direction: column;
	gap: 12px;
	overflow-y: auto;
}

.modal--wide {
	max-width: 720px;
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
</style>
