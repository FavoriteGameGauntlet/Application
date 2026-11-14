<script setup lang="ts">
import UiBadge from './UiBadge.vue'

type Props = {
	value: number
}

defineProps<Props>()
</script>

<template>
	<UiBadge>Количество: {{ value }}</UiBadge>
</template>
