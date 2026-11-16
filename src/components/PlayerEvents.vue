<script setup lang="ts">
import { ref, watch } from 'vue'
import type { JournalEntry, Login } from '../api-facade/contracts'
import { RouteName } from '../router/routeNames'
import { useJournalStore } from '../stores/journalStore'
import EventFeed from './EventFeed.vue'

type Props = {
	login: Login
}

const { login } = defineProps<Props>()

const DAY_MS = 24 * 60 * 60 * 1000

const journalStore = useJournalStore()

const entries = ref<JournalEntry[]>([])
/** a refresh of shown events loads quietly, a next page shows its placeholders */
const pending = ref<'first' | 'more'>()
/** undefined once the last page of the day is read */
const cursor = ref<string>()
/** the empty and the end states wait for the first answer */
const loaded = ref(false)

/** the day is fixed when the feed restarts, so the pages after the first one keep its bounds */
let from = ''
/** a restart drops the pages still in flight for the previous one */
let generation = 0

/** the first page replaces the shown events, so a refresh after an action does not blink empty */
const loadPage = async (first: boolean) => {
	const own = generation

	pending.value = first ? 'first' : 'more'

	try {
		const page = await journalStore.fetch({
			user: login,
			from,
			cursor: first ? undefined : cursor.value,
		})

		if (own !== generation) return

		entries.value = first ? page.items : [...entries.value, ...page.items]
		cursor.value = page.nextCursor
		loaded.value = true
	} finally {
		if (own === generation) pending.value = undefined
	}
}

const more = () => {
	if (pending.value || !cursor.value) return

	loadPage(false)
}

watch(
	[() => login, () => journalStore.revision],
	() => {
		generation++
		from = new Date(Date.now() - DAY_MS).toISOString()
		loadPage(true)
	},
	{ immediate: true },
)
</script>

<template>
	<EventFeed
		title="Недавние события"
		link-label="Вся история"
		:link-to="{
			name: RouteName.Resources,
			params: { tab: 'history' },
			query: { user: login },
		}"
		:entries
		:loading="pending === 'more' || (pending === 'first' && !entries.length)"
		:ended="loaded && !cursor"
		empty-text="За сутки ничего не происходило."
		end-text="Больше событий за сутки нет"
		@more="more"
	/>
</template>
