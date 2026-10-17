<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ResourceHistoryRow } from '../api-facade/contracts'
import { RouteName } from '../router/routeNames'
import { useJournalStore } from '../stores/journalStore'
import { useMembersStore } from '../stores/membersStore'
import { useResourcesStore } from '../stores/resourcesStore'
import { useSessionStore } from '../stores/sessionStore'
import { formatMoment, formatRemaining } from '../utils/format'
import { groupItems } from '../utils/userItems'
import UiInput from './ui/UiInput.vue'
import UiSelect from './ui/UiSelect.vue'

type Category = 'items' | 'points' | 'perks' | 'effects'

const journalStore = useJournalStore()
const membersStore = useMembersStore()
const resourcesStore = useResourcesStore()
const sessionStore = useSessionStore()

const user = defineModel<string>('user', { required: true })

const categories = [
	{ value: 'items', label: 'Предметы' },
	{ value: 'points', label: 'Очки' },
	{ value: 'perks', label: 'Перки' },
	{ value: 'effects', label: 'Эффекты' },
]

const category = ref<Category>('items')
const query = ref('')
const expanded = ref<number>()
const history = ref<ResourceHistoryRow[]>([])

const selected = computed(() => resourcesStore.byUser[user.value])

const userOptions = computed(() =>
	membersStore.users.map((p) => ({
		value: p.login,
		label: p.login === sessionStore.login ? `${p.login} (ты)` : p.login,
	})),
)

const rows = computed(() => {
	const q = query.value.trim().toLowerCase()
	const resources = selected.value

	if (!resources) return []

	const all = {
		items: () =>
			groupItems(resources.items).map((item) => ({
				id: item.itemId,
				name: item.name,
				note: '',
				value: `×${item.count}`,
				expandable: true,
			})),
		points: () =>
			resourcesStore.personalTypes.map((type) => ({
				id: type.id,
				name: type.name,
				note: '',
				value: String(resources.points[type.id] ?? 0),
				expandable: false,
			})),
		perks: () =>
			resources.perks.map((perk) => ({
				id: perk.id,
				name: perk.name,
				note: perk.kind === 'active' ? 'активный' : 'пассивный',
				value: '',
				expandable: false,
			})),
		effects: () =>
			resources.effects.map((effect) => ({
				id: effect.id,
				name: effect.name,
				note: effect.usesMax != null ? `${effect.usesLeft}/${effect.usesMax} исп.` : '',
				value: effect.expiresAt ? formatRemaining(effect.expiresAt) : '',
				expandable: false,
			})),
	}

	return all[category.value]().filter((r) => !q || r.name.toLowerCase().includes(q))
})

watch(
	[user, () => journalStore.revision],
	() => resourcesStore.loadUser(user.value),
	{ immediate: true },
)

watch([user, category], () => {
	expanded.value = undefined
	query.value = ''
})

const toggleRow = async (id: number, expandable: boolean) => {
	if (!expandable) return

	if (expanded.value === id) {
		expanded.value = undefined
		return
	}

	expanded.value = id
	history.value = []
	history.value = await resourcesStore.fetchHistory(user.value, 'items', id)
}
</script>

<template>
	<div class="panel">
		<span class="label">Ресурсы игрока</span>

		<div class="panel__selects">
			<UiSelect v-model="user" :options="userOptions" aria-label="Игрок" />
			<UiSelect v-model="category" :options="categories" aria-label="Тип ресурса" />
		</div>

		<UiInput v-model="query" placeholder="Найти…" icon="search" />

		<div class="rows">
			<div
				v-for="row in rows"
				:key="row.id"
				class="row"
				:class="{ 'row--open': expanded === row.id }"
			>
				<div
					class="row__main"
					:class="{ 'row__main--expandable': row.expandable }"
					@click="toggleRow(row.id, row.expandable)"
				>
					<span
						class="row__name"
						:class="{ 'row__name--open': expanded === row.id }"
						:title="row.name"
					>
						{{ row.name }}
					</span>
					<span class="row__note">{{ row.note }}</span>
					<span class="row__value">{{ row.value }}</span>
				</div>

				<div v-if="expanded === row.id" class="row__history">
					<div v-for="(h, i) in history" :key="i" class="history">
						<span class="history__source">{{ formatMoment(h.at) }} · {{ h.source }}</span>
						<span class="history__delta">{{ h.delta }}</span>
					</div>
					<span v-if="!history.length" class="history__empty">Изменений за неделю нет.</span>
					<RouterLink
						class="row__link"
						:to="{
							name: RouteName.Resources,
							params: { tab: 'history' },
							query: { user },
						}"
					>
						Все изменения
					</RouterLink>
				</div>
			</div>

			<span v-if="!rows.length" class="rows__empty">Ничего не нашлось.</span>
		</div>
	</div>
</template>

<style scoped>
.panel {
	display: flex;
	flex-direction: column;
	gap: 12px;
	min-width: 0;
	padding: 16px;
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.panel__selects {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.rows {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.row {
	display: flex;
	flex-direction: column;
	border-radius: var(--radius-sm);
}

.row--open {
	background: var(--surface-sunken);
}

.row__main {
	display: flex;
	align-items: center;
	gap: 8px;
	min-height: 36px;
	padding: 0 10px;
	font: var(--type-body-sm);
	color: var(--text-strong);
	border-radius: var(--radius-sm);
}

.row__main:hover {
	background: var(--surface-sunken);
}

.row__main--expandable {
	cursor: pointer;
}

.row__name {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.row__name--open {
	font-weight: 600;
}

.row__note {
	flex-shrink: 0;
	font: var(--type-caption);
	color: var(--text-subtle);
}

.row__value {
	flex-shrink: 0;
	font: 600 13px / 1 var(--font-mono);
	color: var(--text-strong);
}

.row__history {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 4px 10px 10px;
}

.history {
	display: flex;
	justify-content: space-between;
	gap: 8px;
	font: var(--type-caption);
	color: var(--text-muted);
}

.history__source {
	min-width: 0;
}

.history__delta {
	font: var(--type-mono);
	color: var(--text-strong);
}

.history__empty {
	font: var(--type-caption);
	color: var(--text-subtle);
}

.row__link {
	align-self: flex-start;
	margin-top: 2px;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
}

.rows__empty {
	padding: 8px 10px;
	font: var(--type-body-sm);
	color: var(--text-subtle);
}
</style>
