<script setup lang="ts">
import UiTimestamp from '../../../components/ui/UiTimestamp.vue'
import { useApiTimerStore } from '../../../stores/api/apiTimerStore'

const timerStore = useApiTimerStore()
</script>

<template>
	<UiTimestamp :time="timerStore.remaining" />
</template>

<style scoped></style>
