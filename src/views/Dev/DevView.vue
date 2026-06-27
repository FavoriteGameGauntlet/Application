<script setup lang="ts">
import { Temporal } from '@js-temporal/polyfill'
import { storeToRefs } from 'pinia'
import { computed, onUnmounted, ref, useTemplateRef, watch, watchEffect } from 'vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiTimestamp from '../../components/ui/UiTimestamp.vue'
import { useSettingsStore } from '../../stores/settingsStore'

const button = useTemplateRef('button')

const settings = useSettingsStore()
const { roughnessModifier } = storeToRefs(settings)

const roughnessValue = ref(roughnessModifier.value.toString())

const buttonWidth = ref('200')

watchEffect(() => {
	if (!button.value) return

	button.value.style.setProperty('--basis', buttonWidth.value + 'px')
})

watch([roughnessValue], () => {
	roughnessModifier.value = Number.isNaN(+roughnessValue.value)
		? 1
		: +roughnessValue.value
})

const elapsed = ref(Temporal.Duration.from({ seconds: 0 }))
const isRunning = ref(false)
let interval: ReturnType<typeof setInterval> | null = null

const start = () => {
	if (isRunning.value) return
	isRunning.value = true
	interval = setInterval(() => {
		elapsed.value = elapsed.value.add({ seconds: 1 })
	}, 1000)
}

const stop = () => {
	if (!isRunning.value) return
	isRunning.value = false
	if (interval) { clearInterval(interval); interval = null }
}

onUnmounted(() => { if (interval) clearInterval(interval) })

const onToggleButton = () => {
	if (isRunning.value) {
		stop()
	} else {
		start()
	}
}

const onAddTimeButton = () => {
	elapsed.value = elapsed.value.add({ seconds: 10 })
}

const onSubTimeButton = () => {
	elapsed.value = elapsed.value.subtract({ seconds: 10 })
}

const toggleButtonText = computed(() => (isRunning.value ? 'Стоп' : 'Старт'))
</script>

<template>
	<div class="dev-view">
		<div class="big">
			<UiTimestamp :time="elapsed" />

			<UiButton class="time-button" @click="onToggleButton">{{
				toggleButtonText
			}}</UiButton>

			<UiButton class="time-button" @click="onAddTimeButton">+ 10 sec</UiButton>
			<UiButton class="time-button" @click="onSubTimeButton">- 10 sec</UiButton>
		</div>

		<div class="many">
			<UiTimestamp
				v-for="i in 100"
				:key="i"
				:time="elapsed.add({ seconds: 10 * i })"
			/>
		</div>

		<div class="controls">
			<div ref="button" class="button-row">
				<UiButton class="button" :key="i" v-for="i in 10"> Test </UiButton>
			</div>

			<code>roughness</code>
			<input v-model="roughnessValue" />

			<code>width</code>
			<input type="range" v-model="buttonWidth" min="100" max="400" />
		</div>
	</div>
</template>

<style scoped>
.dev-view {
	display: flex;
	width: 100%;
	flex-direction: column;
}

.big {
	display: flex;
	width: 100%;
	height: 600px;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	font-size: 3rem;
}

.time-button {
	width: 400px;
	height: 96px;
}

.many {
	display: flex;
	flex-wrap: wrap;
}

.button-row {
	display: flex;
	width: 100%;
	flex-direction: row;
	flex-wrap: wrap;
	overflow: visible;
	border: 4px dashed rgba(0, 0, 0, 0.2);
}

.button {
	flex-basis: var(--basis);
	height: 60px;
}

.controls {
	display: flex;
	width: 960px;
	flex-direction: column;
}
</style>
