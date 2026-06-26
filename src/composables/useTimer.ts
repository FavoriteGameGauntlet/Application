import { Temporal } from '@js-temporal/polyfill'
import { computed, ref } from 'vue'
import { useTimeSync } from './useTimeSync'

type Options = {
	mode?: 'add' | 'subtract'
	initialElapsed?: Temporal.Duration
}

export const useTimer = ({
	mode = 'add',
	initialElapsed = Temporal.Duration.from({ seconds: 0 }),
}: Options = {}) => {
	const elapsed = ref(Temporal.Duration.from({ seconds: 0 }))
	let baseElapsed = initialElapsed
	let startedAt: Temporal.Instant | null = null
	const stopTimeSync = ref<(() => void) | null>(null)

	const stop = () => {
		if (!stopTimeSync.value) return

		stopTimeSync.value()
		stopTimeSync.value = null
		baseElapsed = elapsed.value
		startedAt = null
	}

	const updateElapsed = (time: Temporal.Instant = Temporal.Now.instant()) => {
		elapsed.value = baseElapsed[mode](time.since(startedAt!)).round({
			largestUnit: 'hour',
			smallestUnit: 'second',
			roundingMode: mode === 'subtract' ? 'ceil' : 'trunc',
		})
	}

	const start = () => {
		if (stopTimeSync.value) return

		let newStartedAt
		;({ stop: stopTimeSync.value, startedAt: newStartedAt } = useTimeSync(
			({ now }) => updateElapsed(now),
		))

		startedAt = newStartedAt

		updateElapsed()
	}

	const set = (newElapsed: Temporal.Duration) => {
		if (startedAt) {
			const diff = newElapsed.subtract(elapsed.value)
			startedAt = startedAt[mode === 'add' ? 'subtract' : 'add'](diff) ?? null

			updateElapsed()
		} else {
			baseElapsed = newElapsed
			elapsed.value = newElapsed
		}
	}

	return {
		elapsed: computed({ get: () => elapsed.value, set }),
		isRunning: computed(() => Boolean(stopTimeSync.value)),
		start,
		stop,
		// set,
	}
}
