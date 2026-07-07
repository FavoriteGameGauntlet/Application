<script setup lang="ts">
import type { Temporal } from '@js-temporal/polyfill'
import { computed } from 'vue'

type Props = {
	time: Temporal.PlainTime | Temporal.Duration | Temporal.PlainDateTime
}

const { time } = defineProps<Props>()

const formatDuration = (duration: Temporal.Duration) => {
	const ad = duration
		.abs()
		.round({ largestUnit: 'hours', smallestUnit: 'seconds' })
	return `${duration.sign === -1 ? '-' : ''}${ad.hours}:${ad.minutes.toString().padStart(2, '0')}:${ad.seconds.toString().padStart(2, '0')}`
}

const formatTime = (time: Temporal.PlainTime | Temporal.PlainDateTime) =>
	`${time.hour}:${time.minute.toString().padStart(2, '0')}:${time.second.toString().padStart(2, '0')}`

const formattedTime = computed(() => {
	if ('hours' in time) {
		return formatDuration(time)
	} else {
		return formatTime(time)
	}
})
</script>

<template>
	<time class="ui-timestamp" :datetime="time.toString()">
		{{ formattedTime }}
	</time>
</template>

<style scoped>
.ui-timestamp {
	font-family: var(--font-mono);
	line-height: 80%;
}
</style>
