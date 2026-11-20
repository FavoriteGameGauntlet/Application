<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { api } from '../../../api-facade/api'
import type { WheelCatalogGroup } from '../../../api-facade/contracts'
import WheelEntryTable from '../../../components/WheelEntryTable.vue'
import WheelGroupCard from '../../../components/WheelGroupCard.vue'
import WheelGroupList from '../../../components/WheelGroupList.vue'
import UiTabs from '../../../components/ui/UiTabs.vue'
import { useToastStore } from '../../../stores/toastStore'

const tabs = [
	{ value: 'changes', label: 'Пункты' },
	{ value: 'games', label: 'Игры' },
]

const kind = ref<WheelCatalogGroup['kind']>('changes')
/** undefined while the groups of the kind are loading */
const groups = ref<WheelCatalogGroup[]>()
const groupId = ref<number>()
const query = ref('')

const group = computed(
	() => groups.value?.find((g) => g.id === groupId.value) ?? groups.value?.[0],
)

const select = (target: WheelCatalogGroup) => {
	groupId.value = target.id
	query.value = ''
}

watch(
	kind,
	async (requested) => {
		groups.value = undefined
		groupId.value = undefined
		query.value = ''

		try {
			const loaded = await api.wheel.catalog(requested)

			// the tab may have been switched while the groups were loading
			if (requested === kind.value) groups.value = loaded
		} catch (e) {
			useToastStore().error(e)
		}
	},
	{ immediate: true },
)
</script>

<template>
	<UiTabs
		:model-value="kind"
		:items="tabs"
		variant="pill"
		@update:model-value="kind = $event as WheelCatalogGroup['kind']"
	/>

	<div v-if="groups" class="layout">
		<WheelGroupList :groups :selected-id="group?.id" @select="select" />

		<div v-if="group" class="main">
			<WheelGroupCard :group />

			<WheelEntryTable
				v-model:query="query"
				:group
				:empty-text="
					group.kind === 'changes'
						? 'В группе нет пунктов.'
						: 'В группе нет игр.'
				"
			/>
		</div>
	</div>
</template>

<style scoped>
.layout {
	display: grid;
	grid-template-columns: 256px minmax(0, 1fr);
	gap: 20px;
	align-items: start;
}

.main {
	display: flex;
	flex-direction: column;
	gap: 16px;
	min-width: 0;
}
</style>
