<script setup lang="ts">
import UiTimestamp from '../../../components/ui/UiTimestamp.vue'
import { useFeatureTimerStore } from '../../../stores/feature/featureTimerStore'

const timerStore = useFeatureTimerStore()
</script>

<template>
	<UiTimestamp :time="timerStore.elapsed" />
</template>

<style scoped></style>
