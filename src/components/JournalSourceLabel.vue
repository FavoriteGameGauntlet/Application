<script setup lang="ts">
import { computed } from 'vue'
import type { JournalSource } from '../api-facade/contracts'
import { journalSourceParts } from '../utils/journalSource'

type Props = {
	source: JournalSource
	/** set on an entry that corrects another one, it turns «ручное изменение» into «исправление» */
	correctsEntryId?: number
}

const { source, correctsEntryId } = defineProps<Props>()

const parts = computed(() => journalSourceParts(source, correctsEntryId))
</script>

<template>
	<span class="source">
		<span class="source__kind">{{ parts.kind }}</span>
		<span v-if="parts.name" class="source__name" :title="parts.name">{{
			parts.name
		}}</span>
	</span>
</template>

<style scoped>
.source {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.source__kind {
	font: var(--type-caption);
	color: var(--text-muted);
}

.source__name {
	overflow: hidden;
	font: var(--type-body-sm);
	color: var(--text-body);
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
