<script setup lang="ts">
import type { Login } from '../api-facade/contracts'
import { useJournalPages } from '../composables/useJournalPages'
import { RouteName } from '../router/routeNames'
import EventFeed from './EventFeed.vue'

type Props = {
	login: Login
}

const { login } = defineProps<Props>()

const { entries, pending, ended, more } = useJournalPages(() => ({
	user: login,
	period: { hours: 24 },
}))
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
		:ended
		empty-text="За сутки ничего не происходило."
		end-text="Больше событий за сутки нет"
		@more="more"
	/>
</template>
