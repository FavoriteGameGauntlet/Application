<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { JournalEntry } from '../api-facade/contracts'
import { useMembersStore } from '../stores/membersStore'
import { formatMoment } from '../utils/format'
import JournalSourceLabel from './JournalSourceLabel.vue'

type Props = {
	title: string
	linkLabel: string
	linkTo: RouteLocationRaw
	entries: JournalEntry[]
	emptyText?: string
}

defineProps<Props>()

const membersStore = useMembersStore()
</script>

<template>
	<div class="feed">
		<div class="feed__head">
			<span class="feed__title">{{ title }}</span>
			<RouterLink class="feed__link" :to="linkTo">{{ linkLabel }}</RouterLink>
		</div>

		<div v-if="entries.length" class="feed__list">
			<div v-for="entry in entries" :key="entry.id" class="event">
				<span
					class="event__dot"
					:style="{ background: membersStore.colorOf(entry.actor) }"
				></span>
				<div class="event__body">
					<div class="event__head">
						<span class="event__who">{{ entry.actor }}</span>
						<span class="event__time">{{
							formatMoment(entry.at).replace('сегодня ', '')
						}}</span>
					</div>
					<JournalSourceLabel
						:source="entry.source"
						:corrects-entry-id="entry.correctsEntryId"
					/>
					<div
						v-for="(change, i) in entry.changes"
						:key="i"
						class="event__change"
					>
						<span class="event__user">{{ change.login }}</span>
						<span class="event__text">{{ change.text }}</span>
					</div>
				</div>
			</div>
		</div>

		<span v-if="!entries.length && emptyText" class="feed__empty">{{
			emptyText
		}}</span>
	</div>
</template>

<style scoped>
.feed {
	display: flex;
	flex-direction: column;
	gap: 16px;
	min-width: 0;
	padding: 16px;
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.feed__head {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
}

.feed__title {
	font: var(--type-h4);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
}

.feed__link {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
}

.feed__empty {
	font: var(--type-body-sm);
	color: var(--text-subtle);
}

/* several changes per entry make the height depend on more than the entry count */
.feed__list {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-height: 360px;
	overflow-y: auto;
}

.event {
	display: flex;
	gap: 12px;
}

.event__dot {
	flex: none;
	width: 8px;
	height: 8px;
	margin-top: 6px;
	border-radius: var(--radius-pill);
}

.event__body {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
}

.event__head {
	display: flex;
	align-items: baseline;
	gap: 8px;
	font: var(--type-body-sm);
	color: var(--text-muted);
}

.event__who {
	flex: 1;
	min-width: 0;
	font-weight: 600;
	color: var(--text-strong);
}

.event__time {
	font: var(--type-caption);
	white-space: nowrap;
}

.event__change {
	display: grid;
	grid-template-columns: 80px minmax(0, 1fr);
	gap: 8px;
	font: var(--type-body-sm);
}

.event__user {
	overflow: hidden;
	color: var(--text-muted);
	text-overflow: ellipsis;
	white-space: nowrap;
}

.event__text {
	color: var(--text-body);
}
</style>
