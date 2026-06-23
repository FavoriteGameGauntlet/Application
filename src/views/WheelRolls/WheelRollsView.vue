<script setup lang="ts">
import UiButton from '../../components/ui/UiButton.vue'
import { useFeatureWheelStore } from '../../stores/feature/featureWheelStore'
import { computed, onMounted } from 'vue'
import { funnyEffects } from './constants/funnyEffects'
import UiView from '../../components/ui/UiView.vue'

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
				<div class="effect-card" :key="effect.name" v-for="effect in visibleEffects">
					{{ effect.name }}
				</div>
			</div>

			<UiButton class="roll-button" @click="onRollButtonClick">
				Прокрутить
			</UiButton>
		</div>
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
	height: 160px;
	width: 120px;
	border: 1px solid #64748b;
}

.roll-button {
	height: 56px;
	width: 224px;
	justify-self: center;
}
</style>
