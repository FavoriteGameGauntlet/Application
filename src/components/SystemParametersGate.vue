<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useFeatureSystemParametersStore } from '../stores/feature/featureSystemParametersStore'

const systemParametersStore = useFeatureSystemParametersStore()

const now = ref(Date.now())
let interval: ReturnType<typeof setInterval> | null = null

watch(
	() => systemParametersStore.nextRetryAt,
	() => {
		now.value = Date.now()
	},
)

onMounted(() => {
	interval = setInterval(() => {
		now.value = Date.now()
	}, 1000)
})

onUnmounted(() => {
	if (interval) clearInterval(interval)
})

const secondsUntilRetry = computed(() => {
	const nextRetryAt = systemParametersStore.nextRetryAt
	if (!nextRetryAt) return 0

	return Math.max(0, Math.ceil((nextRetryAt - now.value) / 1000))
})
</script>

<template>
	<slot v-if="systemParametersStore.getAllSystemParametersState.isLoaded" />
	<div
		class="system-parameters-error"
		v-else-if="systemParametersStore.retriesExhausted"
	>
		<p class="message">Сервер недоступен</p>
		<p class="retry-timer">Следующая попытка через {{ secondsUntilRetry }} с</p>
	</div>
</template>

<style scoped>
.system-parameters-error {
	display: flex;
	flex-direction: column;
	gap: 8px;
	height: 100vh;
	align-items: center;
	justify-content: center;
	text-align: center;
	padding: 24px;
}

.message {
	font-size: 1.5rem;
	font-weight: 700;
	color: #ef4444;
}

.retry-timer {
	font-size: 1rem;
	color: #64748b;
}
</style>
