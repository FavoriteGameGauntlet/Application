<script setup lang="ts">
import UiButton from '../../components/ui/UiButton.vue'
import trashIcon from '../../assets/icons/trash.svg'
import { useFeatureWheelStore } from '../../stores/feature/featureWheelStore'
import { computed, onMounted, ref, watch } from 'vue'
import UiView from '../../components/ui/UiView.vue'
import WheelEffectApplyForm from './components/WheelEffectApplyForm.vue'
import WheelEffectCard from './components/WheelEffectCard.vue'
import { TimerState } from '../../api-facade/models/timers-models'
import type { RolledWheelEffectDto } from '../../api-facade/models/wheel-effects-models'
import { formatInstant } from '../../utils/temporal'
import { useAuthStore } from '../../stores/authStore'
import { useFeatureTimerStore } from '../../stores/feature/featureTimerStore'
import { useFeatureUserStore } from '../../stores/feature/featureUserStore'

const wheelStore = useFeatureWheelStore()
const authStore = useAuthStore()
const userStore = useFeatureUserStore()
const timerStore = useFeatureTimerStore()

const effectsHistory = computed(() =>
	authStore.login ? (userStore.userEffects[authStore.login] ?? []) : [],
)

const emptyEffects: RolledWheelEffectDto[] = Array.from(
	{ length: 5 },
	(_, i) => ({ name: '', isApplied: false, position: i }),
)

const hasRoll = computed(() => !!wheelStore.currentEffects)

const visibleEffects = computed(() => {
	if (wheelStore.currentEffects) {
		return [...wheelStore.currentEffects].sort(
			(a, b) => a.position - b.position,
		)
	}

	return emptyEffects
})

const centerIndex = computed(() =>
	Math.floor((visibleEffects.value.length - 1) / 2),
)

const isReroll = ref(false)

const onRollButtonClick = () => {
	wheelStore.getAvailableEffects()
	wheelStore.roll(isReroll.value)
}

const hasAppliedEffect = computed(
	() => wheelStore.currentEffects?.some((effect) => effect.isApplied) ?? false,
)

const onClearButtonClick = () => {
	wheelStore.clearLastRoll()
}

const selectedEffect = ref<RolledWheelEffectDto | null>(null)
const showApplyForm = ref(false)

const closeModal = () => {
	selectedEffect.value = null
	showApplyForm.value = false
}

onMounted(() => {
	wheelStore.getLastRoll()

	if (authStore.login) userStore.getUserEffects(authStore.login)
	if (authStore.isLoggedIn) wheelStore.getAvailableCount()
})

watch(
	() => timerStore.state,
	(state) => {
		if (state === TimerState.Finished && authStore.isLoggedIn) {
			wheelStore.getAvailableCount()
		}
	},
)
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
					<WheelEffectCard
						v-for="(effect, i) in visibleEffects"
						:key="i"
						:effect="effect"
						:is-center="i === centerIndex"
						:is-placeholder="!hasRoll"
						@select="selectedEffect = $event"
					/>
				</div>
				<div class="reel-pointer"></div>
			</div>

			<div class="roll-controls">
				<div class="roll-extra">
					<label class="reroll-checkbox">
						<input type="checkbox" v-model="isReroll" />
						Перекрутить
					</label>

					<p v-if="isReroll" class="reroll-message">
						Прокруты не будут потрачены
					</p>
				</div>

				<UiButton
					class="roll-button"
					:disabled="
						!wheelStore.availableRollCount ||
						(!!wheelStore.currentEffects && !hasAppliedEffect && !isReroll)
					"
					@click="onRollButtonClick"
				>
					{{ isReroll ? 'Перекрутить' : 'Прокрутить' }}
				</UiButton>

				<UiButton
					class="clear-button"
					:disabled="!hasAppliedEffect"
					title="Очистить"
					aria-label="Очистить"
					@click="onClearButtonClick"
				>
					<span class="clear-icon" :style='{ "--icon-url": `url("${trashIcon}")` }'></span>
				</UiButton>
			</div>

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
	border: 1px solid var(--color-border);
	border-radius: 20px;
	padding: 5px 14px;
	font-size: 0.8125rem;
	color: var(--color-muted);
}

.reel {
	position: relative;
	display: flex;
	padding: 16px 28px 16px 16px;
	border: 1px solid var(--color-border);
}

.effects-grid {
	display: flex;
	flex-direction: column;
	gap: 8px;
	width: 100%;
}

.effect-applied {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 0.75rem;
	color: var(--color-muted);
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
	border-right: 12px solid var(--color-muted);
}

.roll-controls {
	display: grid;
	grid-template-columns: 1fr auto 1fr;
	align-items: center;
	column-gap: 16px;
}

.roll-extra {
	grid-column: 1;
	position: relative;
	justify-self: start;
}

.roll-button {
	grid-column: 2;
	height: 56px;
	width: 224px;
}

.clear-button {
	grid-column: 3;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 56px;
	width: 56px;
	justify-self: start;
}

.clear-icon {
	display: inline-block;
	width: 20px;
	height: 20px;
	background-color: currentColor;
	-webkit-mask-image: var(--icon-url);
	mask-image: var(--icon-url);
	-webkit-mask-size: contain;
	mask-size: contain;
	-webkit-mask-repeat: no-repeat;
	mask-repeat: no-repeat;
	-webkit-mask-position: center;
	mask-position: center;
}

.reroll-checkbox {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 0.875rem;
	color: var(--color-text-secondary);
	cursor: pointer;
}

.reroll-message {
	position: absolute;
	top: 100%;
	left: 0;
	margin-top: 4px;
	font-size: 0.8125rem;
	color: var(--color-muted);
	white-space: nowrap;
}

.history-title {
	font-size: 0.875rem;
	color: var(--color-muted);
	font-weight: 500;
}

.empty-message {
	color: var(--color-muted);
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
	border: 1px solid var(--color-border);
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
	color: var(--color-muted);
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
	color: var(--color-text-secondary);
	line-height: 1.6;
}

.modal-empty {
	color: var(--color-faint);
	font-style: italic;
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
