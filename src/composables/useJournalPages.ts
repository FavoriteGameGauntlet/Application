import type { Temporal } from '@js-temporal/polyfill'
import { computed, onScopeDispose, ref, watch } from 'vue'
import type { JournalEntry, JournalQuery } from '../api-facade/contracts'
import { useJournalStore } from '../stores/journalStore'
import { useToastStore } from '../stores/toastStore'
import { periodStart } from '../utils/calendar'

type PageFilters = Omit<JournalQuery, 'cursor' | 'from'> & {
	period?: Temporal.DurationLike
}

export const useJournalPages = (getFilters: () => PageFilters) => {
	const journalStore = useJournalStore()
	const toast = useToastStore()
	const filters = computed(getFilters)
	const entries = ref<JournalEntry[]>([])
	const cursor = ref<string>()
	const pending = ref<'first' | 'more'>()
	const failed = ref(false)
	const ended = computed(() => !pending.value && !failed.value && !cursor.value)

	let query: JournalQuery
	let generation = 0

	const load = async (kind: 'first' | 'more') => {
		const own = generation
		pending.value = kind
		failed.value = false

		try {
			const page = await journalStore.fetch({ ...query, cursor: cursor.value })

			if (own !== generation) return

			entries.value =
				kind === 'first' ? page.items : [...entries.value, ...page.items]
			cursor.value = page.nextCursor
		} catch (e) {
			if (own !== generation) return

			failed.value = true
			toast.error(e)
		} finally {
			if (own === generation) pending.value = undefined
		}
	}

	const more = () => {
		if (!pending.value && cursor.value) return load('more')
	}

	const retry = () => {
		if (!pending.value && failed.value)
			return load(cursor.value ? 'more' : 'first')
	}

	watch(
		[filters, () => journalStore.revision],
		([current], [previous]) => {
			generation++
			cursor.value = undefined
			if (current !== previous) entries.value = []

			const { period, ...selection } = current
			// The period stays fixed while the pages of this query are read.
			query = period ? { ...selection, from: periodStart(period) } : selection
			void load('first')
		},
		{ immediate: true },
	)

	onScopeDispose(() => {
		generation++
	})

	return { entries, cursor, pending, failed, ended, more, retry }
}
