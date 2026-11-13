<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CatalogEntry } from '../../api-facade/contracts'
import CatalogTable from '../../components/CatalogTable.vue'
import {
	type CatalogView,
	catalogCells,
	catalogHeads,
	catalogKindOf,
	catalogViews,
	catalogWide,
	filterCatalogRows,
} from '../../components/catalogTable'
import UiInput from '../../components/ui/UiInput.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import UiTabs from '../../components/ui/UiTabs.vue'
import { useResourcesStore } from '../../stores/resourcesStore'

const resourcesStore = useResourcesStore()

const view = ref<CatalogView>('points')
const query = ref('')

const kind = computed(() => catalogKindOf(view.value))

/** Undefined while the list of the open tab is not loaded yet. */
const entries = computed<CatalogEntry[] | undefined>(() => {
	if (kind.value !== 'point-types')
		return resourcesStore.catalogEntries[kind.value]

	return resourcesStore.pointTypes
		.filter((type) => type.isShared === (view.value === 'shared'))
		.map((type) => ({ ...type, deleted: false }))
})

const rows = computed(() =>
	filterCatalogRows(
		(entries.value ?? []).map((entry) => ({
			entry,
			...catalogCells(view.value, entry),
		})),
		query.value,
	),
)

watch(
	view,
	() => {
		query.value = ''

		if (kind.value !== 'point-types')
			resourcesStore.loadCatalogEntries(kind.value)
	},
	{ immediate: true },
)
</script>

<template>
	<div class="catalog">
		<div class="head">
			<UiPageTitle>Каталог</UiPageTitle>
			<div class="head__spacer"></div>
			<div class="head__search">
				<UiInput
					v-model="query"
					compact
					icon="search"
					placeholder="Найти…"
					aria-label="Поиск"
				/>
			</div>
		</div>

		<UiTabs
			:model-value="view"
			:items="catalogViews"
			@update:model-value="view = $event as CatalogView"
		/>

		<CatalogTable
			:key="view"
			:heads="catalogHeads[view]"
			:wide="catalogWide(view)"
			:rows="rows"
			:empty="
				entries
					? query.trim()
						? 'Ничего не найдено.'
						: 'Пока ничего нет.'
					: undefined
			"
		/>
	</div>
</template>

<style scoped>
.catalog {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.head {
	display: flex;
	align-items: center;
	gap: 20px;
}

.head__spacer {
	flex: 1;
}

.head__search {
	width: 260px;
}
</style>
