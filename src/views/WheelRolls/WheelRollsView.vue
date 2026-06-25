<script setup lang="ts">
import UiButton from '../../components/ui/UiButton.vue'
import { useFeatureWheelStore } from '../../stores/feature/featureWheelStore'
import { computed, onMounted, ref } from 'vue'
import { funnyEffects } from './constants/funnyEffects'
import UiView from '../../components/ui/UiView.vue'
import type { WheelEffect } from '../../api-facade/models/wheel-effects-models'

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
		return wheelStore.currentEffects
	}

	if (wheelStore.availableEffects) {
		return getRandomItems(wheelStore.availableEffects, 5)
	}

	return getRandomItems(funnyEffects, 5)
})

const onRollButtonClick = () => {
	wheelStore.roll()
}

const selectedEffect = ref<WheelEffect | null>(null)

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
				</div>
			</div>

			<UiButton class="roll-button" @click="onRollButtonClick">
				Прокрутить
			</UiButton>
		</div>

		<Teleport to="body">
			<div
				v-if="selectedEffect"
				class="modal-overlay"
				@click.self="selectedEffect = null"
			>
				<div class="modal">
					<h2 class="modal-title">{{ selectedEffect.name }}</h2>
					<p v-if="selectedEffect.description" class="modal-description">
						{{ selectedEffect.description }}
					</p>
					<p v-else class="modal-empty">Описание отсутствует</p>
					<button class="modal-close" @click="selectedEffect = null">
						Закрыть
					</button>
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

.modal-close {
	align-self: flex-end;
	padding: 6px 16px;
	border: 1px solid #64748b;
	border-radius: 4px;
	cursor: pointer;
	background: transparent;
}

.modal-close:hover {
	background-color: #f1f5f9;
}
</style>
