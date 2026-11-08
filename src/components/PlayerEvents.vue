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
const LIMIT = 5

const journalStore = useJournalStore()

const entries = ref<JournalEntry[]>([])

watch(
	[() => login, () => journalStore.revision],
	async () => {
		entries.value = await journalStore.fetch({
			user: login,
			from: new Date(Date.now() - DAY_MS).toISOString(),
			limit: LIMIT,
		})
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
		empty-text="За сутки ничего не происходило."
	/>
</template>
