<script setup lang="ts">
import {
	computed,
	nextTick,
	onBeforeUnmount,
	ref,
	useTemplateRef,
	watch,
} from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import type { JournalEntry } from '../api-facade/contracts'
import { useMembersStore } from '../stores/membersStore'
import { useResourcesStore } from '../stores/resourcesStore'
import { formatMoment } from '../utils/format'
import { journalSourceCatalogKind } from '../utils/journalSource'
import CatalogHoverCard from './CatalogHoverCard.vue'
import JournalSourceLabel from './JournalSourceLabel.vue'
import UiScrollArea from './ui/UiScrollArea.vue'

type Props = {
	title: string
	linkLabel: string
	linkTo: RouteLocationRaw
	entries: JournalEntry[]
	/** the next page is on its way */
	loading?: boolean
	/** no page is left to load */
	ended?: boolean
	emptyText?: string
	endText?: string
}

const { entries, loading, ended } = defineProps<Props>()

const emit = defineEmits<{
	/** the list is scrolled close to its end */
	more: []
}>()

/** the next page is asked for this far before the end of the list */
const MORE_AHEAD = 200

const membersStore = useMembersStore()
const resourcesStore = useResourcesStore()

const scroll = useTemplateRef<InstanceType<typeof UiScrollArea>>('scroll')

const scrolled = ref(false)

const checkEnd = () => {
	const el = scroll.value?.el

	if (!el) return

	scrolled.value = el.scrollTop > 0

	if (el.scrollHeight - el.scrollTop - el.clientHeight < MORE_AHEAD) {
		emit('more')
	}
}

/** a list shorter than the card, or a window grown taller, has no scroll to ask for more */
const resize = new ResizeObserver(checkEnd)

/** the list is not rendered while the empty state shows */
watch(
	() => scroll.value?.el,
	(el, old) => {
		if (old) resize.unobserve(old)
		if (el) resize.observe(el)
	},
)

onBeforeUnmount(() => resize.disconnect())

watch(
	() => entries,
	async () => {
		await nextTick()
		checkEnd()
	},
)

/** the catalogue entry an event names, for its card on hover */
const cardOf = (entry: JournalEntry) => {
	const kind = journalSourceCatalogKind(entry.source)
	const found =
		kind &&
		entry.source.id !== undefined &&
		resourcesStore.catalogEntryOf(kind, entry.source.id)

	return found ? { kind, entry: found } : undefined
}

const hovered = ref<{ id: number; anchor: HTMLElement }>()

const hoveredCard = computed(() => {
	const entry = entries.find((e) => e.id === hovered.value?.id)

	return entry && cardOf(entry)
})

const showsEnd = computed(() => ended && !loading && entries.length > 0)
const showsEmpty = computed(() => ended && !loading && !entries.length)
</script>

<template>
	<div class="feed" :class="{ 'feed--scrolled': scrolled }">
		<div class="feed__head">
			<span class="feed__title">{{ title }}</span>
			<RouterLink class="feed__link" :to="linkTo">{{ linkLabel }}</RouterLink>
		</div>

		<span v-if="showsEmpty && emptyText" class="feed__empty">{{
			emptyText
		}}</span>

		<UiScrollArea v-else ref="scroll" class="feed__list" @scroll="checkEnd">
			<div
				v-for="entry in entries"
				:key="entry.id"
				class="event"
				:class="{ 'event--catalog': cardOf(entry) }"
				@mouseenter="
					hovered = {
						id: entry.id,
						anchor: $event.currentTarget as HTMLElement,
					}
				"
				@mouseleave="hovered = undefined"
			>
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

			<template v-if="loading">
				<div v-for="i in 2" :key="i" class="skeleton">
					<span class="skeleton__dot"></span>
					<span class="skeleton__body">
						<span class="skeleton__bar skeleton__bar--short"></span>
						<span class="skeleton__bar skeleton__bar--shorter"></span>
						<span class="skeleton__bar"></span>
					</span>
				</div>
			</template>

			<span v-if="showsEnd && endText" class="feed__end">{{ endText }}</span>
		</UiScrollArea>

		<CatalogHoverCard
			:anchor="hovered?.anchor"
			:view="hoveredCard?.kind ?? 'items'"
			:entry="hoveredCard?.entry"
			side="left"
			@close="hovered = undefined"
		/>
	</div>
</template>

<style scoped>
/* the card takes the height the grid gives it and never stretches the page: its list scrolls */
.feed {
	display: flex;
	flex-direction: column;
	min-width: 0;
	min-height: 240px;
	padding: 16px 16px 6px;
	overflow: hidden;
	contain: size;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.feed__head {
	display: flex;
	flex: none;
	align-items: baseline;
	justify-content: space-between;
	padding-bottom: 12px;
	border-bottom: 1px solid transparent;
}

.feed--scrolled .feed__head {
	border-bottom-color: var(--border-subtle);
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
	color: var(--text-muted);
}

/* the rows reach into the card padding for their hover plate, the bar sits in the right padding */
.feed__list {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 2px;
	margin: 0 -12px 0 -10px;
	padding: 6px 2px 10px 0;
}

.event {
	display: flex;
	flex: none;
	gap: 12px;
	padding: 8px 10px;
	border-radius: var(--radius-md);
	transition: background var(--dur-fast) var(--ease-out);
}

.event--catalog:hover {
	background: var(--surface-sunken);
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
	overflow: hidden;
	font-weight: 600;
	color: var(--text-strong);
	text-overflow: ellipsis;
	white-space: nowrap;
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

.skeleton {
	display: flex;
	flex: none;
	gap: 12px;
	padding: 8px 10px;
	animation: skeleton 1.2s ease-in-out infinite;
}

.skeleton__dot {
	flex: none;
	width: 8px;
	height: 8px;
	margin-top: 6px;
	background: var(--surface-sunken);
	border-radius: var(--radius-pill);
}

.skeleton__body {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 8px;
	padding-top: 4px;
}

.skeleton__bar {
	width: 72%;
	height: 10px;
	background: var(--surface-sunken);
	border-radius: var(--radius-pill);
}

.skeleton__bar--short {
	width: 46%;
}

.skeleton__bar--shorter {
	width: 30%;
}

@keyframes skeleton {
	50% {
		opacity: 0.55;
	}
}

.feed__end {
	display: flex;
	flex: none;
	align-items: center;
	gap: 10px;
	padding: 12px 10px 6px;
	font: var(--type-caption);
	color: var(--text-muted);
	white-space: nowrap;
}

.feed__end::before,
.feed__end::after {
	content: '';
	flex: 1;
	height: 1px;
	background: var(--border-subtle);
}
</style>
