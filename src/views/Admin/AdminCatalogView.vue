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
import UiIconButton from '../../components/ui/UiIconButton.vue'
import UiTabs from '../../components/ui/UiTabs.vue'
import { useAdminCatalogStore } from '../../stores/adminCatalogStore'
import AdminListHeader from './components/AdminListHeader.vue'
import CatalogEntryDialog from './components/CatalogEntryDialog.vue'

const store = useAdminCatalogStore()

const view = ref<CatalogView>('points')
const query = ref('')
/** the entry that the dialog edits; `{}` is a new one, undefined means the dialog is closed */
const editing = ref<{ entry?: CatalogEntry }>()

const kind = computed(() => catalogKindOf(view.value))

const isPoints = computed(() => kind.value === 'point-types')

/** how many of the resource the users hold; the shared points belong to the party, not to the users */
const holdersHead = computed(() => {
	if (view.value === 'points') return 'Всего у игроков'

	return view.value === 'items' ? 'У игроков' : undefined
})

const heads = computed(() => [
	...catalogHeads[view.value],
	...(holdersHead.value ? [holdersHead.value] : []),
])

/**
 * Undefined while the list of the open tab is not loaded yet,
 * the list of the previous tab is no answer.
 */
const entries = computed<CatalogEntry[] | undefined>(() => {
	if (store.entriesKind !== kind.value) return undefined

	return isPoints.value
		? store.entries.filter((e) => e.isShared === (view.value === 'shared'))
		: store.entries
})

const rows = computed(() =>
	filterCatalogRows(
		(entries.value ?? []).map((entry) => {
			const cells = catalogCells(view.value, entry)

			return {
				entry,
				main: cells.main,
				extra: [
					...cells.extra,
					...(holdersHead.value ? [String(entry.holdersTotal ?? 0)] : []),
				],
				notes: [
					...cells.notes,
					...(isPoints.value && entry.unitForms
						? [
								`Единица в журнале: ${Object.values(entry.unitForms).join(' / ')}`,
							]
						: []),
				],
			}
		}),
		query.value,
	),
)

watch(
	view,
	() => {
		editing.value = undefined
		query.value = ''
		store.showDeleted = false
	},
	{ immediate: true },
)

watch([kind, () => store.showDeleted], () => store.loadCatalog(kind.value), {
	immediate: true,
})
</script>

<template>
	<div class="catalog">
		<AdminListHeader
			v-model:show-deleted="store.showDeleted"
			v-model:query="query"
			title="Каталог"
			@add="editing = {}"
		/>

		<UiTabs
			:model-value="view"
			:items="catalogViews"
			@update:model-value="view = $event as CatalogView"
		/>

		<CatalogTable
			:key="view"
			:heads="heads"
			:wide="catalogWide(view)"
			:rows="rows"
			has-actions
			:empty="
				entries
					? query.trim()
						? 'Ничего не найдено.'
						: 'Пусто. Нажми «Добавить».'
					: undefined
			"
		>
			<template #actions="{ entry }">
				<template v-if="!entry.deleted">
					<UiIconButton
						icon="pencil"
						size="sm"
						label="Изменить"
						@click.stop="editing = { entry }"
					/>
					<UiIconButton
						icon="trash-2"
						size="sm"
						label="Удалить"
						@click.stop="store.setDeleted(kind, entry, true)"
					/>
				</template>
				<UiIconButton
					v-else
					icon="rotate-ccw"
					size="sm"
					label="Вернуть"
					@click.stop="store.setDeleted(kind, entry, false)"
				/>
			</template>
		</CatalogTable>
	</div>

	<CatalogEntryDialog
		:open="!!editing"
		:kind="kind"
		:entry="editing?.entry"
		:shared="view === 'shared'"
		@close="editing = undefined"
	/>
</template>

<style scoped>
.catalog {
	display: flex;
	flex-direction: column;
	gap: 16px;
}
</style>
