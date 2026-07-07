<script setup lang="ts">
import { ref } from 'vue'
import PointsHistoryList, { type HistoryEntry } from './PointsHistoryList.vue'

defineProps<{
	territoryEntries: HistoryEntry[]
	territoryLabelFor: (source: string) => string
	freeEntries: HistoryEntry[]
	freeLabelFor: (source: string) => string
}>()

const activeTab = ref<'territory' | 'free'>('territory')
</script>

<template>
	<div class="points-history-tabs">
		<div class="sub-tabs">
			<button
				class="sub-tab-button"
				:class="{ 'sub-tab-button--active': activeTab === 'territory' }"
				@click="activeTab = 'territory'"
			>
				территория
			</button>
			<button
				class="sub-tab-button"
				:class="{ 'sub-tab-button--active': activeTab === 'free' }"
				@click="activeTab = 'free'"
			>
				свободные
			</button>
		</div>

		<PointsHistoryList
			v-if="activeTab === 'territory'"
			:entries="territoryEntries"
			:label-for="territoryLabelFor"
			empty-message="Нет истории"
		/>
		<PointsHistoryList
			v-else
			:entries="freeEntries"
			:label-for="freeLabelFor"
			empty-message="Нет истории"
		/>
	</div>
</template>

<style scoped>
.points-history-tabs {
	display: flex;
	flex-direction: column;
	gap: 12px;
	width: 100%;
}

.sub-tabs {
	display: flex;
	gap: 8px;
}

.sub-tab-button {
	padding: 6px 14px;
	background: none;
	border: 1px solid #e2e8f0;
	border-radius: 20px;
	cursor: pointer;
	color: #64748b;
	font-size: 0.8125rem;
}

.sub-tab-button:hover {
	color: #0f172a;
}

.sub-tab-button--active {
	color: #0f172a;
	border-color: #0f172a;
	font-weight: 500;
}
</style>
