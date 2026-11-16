<script setup lang="ts">
import type { CatalogEntry } from '../api-facade/contracts'
import type { CatalogView } from './catalogTable'
import CatalogEntryCard from './CatalogEntryCard.vue'
import UiPopover from './ui/UiPopover.vue'

type Props = {
	/** the hovered row; no anchor or no entry hides the card */
	anchor?: HTMLElement
	view: CatalogView
	entry?: CatalogEntry
	side: 'left' | 'right'
}

const { anchor, entry } = defineProps<Props>()

const emit = defineEmits<{ close: [] }>()

const WIDTH = 360
</script>

<template>
	<UiPopover
		:open="!!anchor && !!entry"
		:anchor="anchor ?? null"
		:side
		:min-width="WIDTH"
		passive
		@close="emit('close')"
	>
		<CatalogEntryCard v-if="entry" :view :entry />
	</UiPopover>
</template>
