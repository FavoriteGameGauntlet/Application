<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type {
	Exchange,
	ResourceHistoryRow,
	ResourceRef,
} from '../../api-facade/contracts'
import UiButton from '../../components/ui/UiButton.vue'
import UiDialog from '../../components/ui/UiDialog.vue'
import UiIcon from '../../components/ui/UiIcon.vue'
import UiInput from '../../components/ui/UiInput.vue'
import UiSelect from '../../components/ui/UiSelect.vue'
import { RouteName } from '../../router/routeNames'
import { useExchangesStore } from '../../stores/exchangesStore'
import { useJournalStore } from '../../stores/journalStore'
import { useMembersStore } from '../../stores/membersStore'
import { useResourcesStore } from '../../stores/resourcesStore'
import { useSessionStore } from '../../stores/sessionStore'
import { formatMoment, formatRemaining } from '../../utils/format'
import { formatResource } from '../../utils/formatResource'

type Category = 'items' | 'points' | 'perks' | 'effects'

const exchangesStore = useExchangesStore()
const journalStore = useJournalStore()
const membersStore = useMembersStore()
const resourcesStore = useResourcesStore()
const sessionStore = useSessionStore()

const categories = [
	{ value: 'items', label: 'Предметы' },
	{ value: 'points', label: 'Очки' },
	{ value: 'perks', label: 'Перки' },
	{ value: 'effects', label: 'Эффекты' },
]

const confirming = ref<Exchange>()

const selectedPlayer = ref(sessionStore.login)
const category = ref<Category>('items')
const query = ref('')
const expanded = ref<string>()
const history = ref<ResourceHistoryRow[]>([])

const mine = computed(() => resourcesStore.byPlayer[sessionStore.login])
const selected = computed(() => resourcesStore.byPlayer[selectedPlayer.value])

const playerOptions = computed(() =>
	membersStore.players.map((p) => ({
		value: p.login,
		label: p.login === sessionStore.login ? `${p.login} (ты)` : p.login,
	})),
)

const text = (ref: ResourceRef) => formatResource(ref, resourcesStore.pointTypes)

/** how many of the resource the current user has */
const have = (ref: ResourceRef) => {
	if (ref.kind === 'points') return mine.value?.points[ref.type] ?? 0
	if (ref.kind === 'item') {
		return mine.value?.items.find((i) => i.name === ref.name)?.held ?? 0
	}

	return 0
}

const amountOf = (ref: ResourceRef) =>
	ref.kind === 'points' || ref.kind === 'item' ? ref.amount : 0

const cards = computed(() =>
	exchangesStore.list.map((exchange) => ({
		exchange,
		give: exchange.give.map((ref) => {
			const enough = have(ref) >= amountOf(ref)

			return { text: enough ? text(ref) : `${text(ref)} (${have(ref)})`, enough }
		}),
		get: exchange.get.map(text),
	})),
)

const confirmRows = computed(() => {
	const exchange = confirming.value

	if (!exchange) return []

	return [
		...exchange.give.map((ref) => ({ ref, sign: -1 })),
		...exchange.get.map((ref) => ({ ref, sign: 1 })),
	].map(({ ref, sign }) => {
		if (ref.kind === 'perk') {
			return { name: `Перк «${ref.name}»`, was: 'нет', now: 'есть', gain: true }
		}

		const was = have(ref)

		return {
			name: ref.kind === 'points' ? ref.type : ref.kind === 'item' ? ref.name : '',
			was,
			now: was + sign * amountOf(ref),
			gain: sign > 0,
		}
	})
})

const rows = computed(() => {
	const q = query.value.trim().toLowerCase()
	const resources = selected.value

	if (!resources) return []

	const all = {
		items: () =>
			resources.items.map((item) => ({
				name: item.name,
				note: `${item.usesLeft}/${item.usesMax} исп.`,
				value: `×${item.held}`,
				expandable: true,
			})),
		points: () =>
			Object.entries(resources.points).map(([name, value]) => ({
				name,
				note: '',
				value: String(value),
				expandable: false,
			})),
		perks: () =>
			resources.perks.map((perk) => ({
				name: perk.name,
				note: perk.kind === 'active' ? 'активный' : 'пассивный',
				value: '',
				expandable: false,
			})),
		effects: () =>
			resources.effects.map((effect) => ({
				name: effect.name,
				note: effect.usesMax != null ? `${effect.usesLeft}/${effect.usesMax} исп.` : '',
				value: effect.expiresAt ? formatRemaining(effect.expiresAt) : '',
				expandable: false,
			})),
	}

	return all[category.value]().filter((r) => !q || r.name.toLowerCase().includes(q))
})

watch(
	[selectedPlayer, () => journalStore.revision],
	() => resourcesStore.loadPlayer(selectedPlayer.value),
	{ immediate: true },
)

watch([selectedPlayer, category], () => {
	expanded.value = undefined
	query.value = ''
})

const toggleRow = async (name: string, expandable: boolean) => {
	if (!expandable) return

	if (expanded.value === name) {
		expanded.value = undefined
		return
	}

	expanded.value = name
	history.value = []
	history.value = await resourcesStore.fetchHistory(selectedPlayer.value, 'items', name)
}

const onConfirm = async () => {
	const exchange = confirming.value

	confirming.value = undefined

	if (exchange) {
		await exchangesStore.execute(exchange)
	}
}

onMounted(() => exchangesStore.load())
</script>

<template>
	<div class="exchanges">
		<span class="exchanges__title">Обмены</span>

		<div class="layout">
			<div class="list">
				<div
					v-for="card in cards"
					:key="card.exchange.id"
					class="card"
					:class="{ 'card--off': !card.exchange.available }"
				>
					<div class="card__head">
						<span class="card__name">{{ card.exchange.name }}</span>
						<UiButton
							variant="secondary"
							icon="arrow-left-right"
							:disabled="!card.exchange.available"
							@click="confirming = card.exchange"
						>
							Обменять
						</UiButton>
					</div>

					<span class="card__desc">{{ card.exchange.description }}</span>

					<div class="card__flow">
						<div class="side">
							<span class="label">Отдаёшь</span>
							<div class="pills">
								<span
									v-for="pill in card.give"
									:key="pill.text"
									class="pill"
									:class="{ 'pill--short': !pill.enough }"
								>
									{{ pill.text }}
								</span>
							</div>
						</div>

						<span class="card__arrow">
							<UiIcon name="arrow-left-right" :size="18" />
						</span>

						<div class="side">
							<span class="label">Получаешь</span>
							<div class="pills">
								<span v-for="pill in card.get" :key="pill" class="pill pill--get">
									{{ pill }}
								</span>
							</div>
						</div>
					</div>

					<span v-if="card.exchange.unavailableReason === 'perk_owned'" class="card__why">
						Перк уже есть, второй раз не купить.
					</span>
				</div>

				<span class="note">
					Пунктирная рамка — ресурса не хватает, в скобках сколько есть. Обмен недоступен, пока
					не хватает хотя бы одного.
				</span>
			</div>

			<div class="panel">
				<span class="label">Ресурсы игрока</span>

				<div class="panel__selects">
					<UiSelect v-model="selectedPlayer" :options="playerOptions" aria-label="Игрок" />
					<UiSelect v-model="category" :options="categories" aria-label="Тип ресурса" />
				</div>

				<UiInput v-model="query" placeholder="Найти…" icon="search" />

				<div class="rows">
					<div
						v-for="row in rows"
						:key="row.name"
						class="row"
						:class="{ 'row--open': expanded === row.name }"
					>
						<div
							class="row__main"
							:class="{ 'row__main--expandable': row.expandable }"
							@click="toggleRow(row.name, row.expandable)"
						>
							<span class="row__name" :class="{ 'row__name--open': expanded === row.name }">
								{{ row.name }}
							</span>
							<span class="row__note">{{ row.note }}</span>
							<span class="row__value">{{ row.value }}</span>
						</div>

						<div v-if="expanded === row.name" class="row__history">
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
									query: { player: selectedPlayer },
								}"
							>
								Все изменения
							</RouterLink>
						</div>
					</div>

					<span v-if="!rows.length" class="rows__empty">Ничего не нашлось.</span>
				</div>
			</div>
		</div>
	</div>

	<UiDialog
		:open="!!confirming"
		:title="confirming ? `Обмен «${confirming.name}»` : ''"
		:width="460"
		@close="confirming = undefined"
	>
		<div class="dialog">
			<div class="dialog__table">
				<div class="dialog__row dialog__row--head">
					<span>Ресурс</span>
					<span class="dialog__right">Было</span>
					<span></span>
					<span class="dialog__right">Станет</span>
				</div>
				<div v-for="row in confirmRows" :key="row.name" class="dialog__row">
					<span class="dialog__name">{{ row.name }}</span>
					<span class="dialog__was">{{ row.was }}</span>
					<span class="dialog__arrow">→</span>
					<span class="dialog__now" :class="{ 'dialog__now--gain': row.gain }">{{ row.now }}</span>
				</div>
			</div>

			<div class="dialog__actions">
				<UiButton variant="outline" @click="confirming = undefined">Отмена</UiButton>
				<UiButton icon="check" @click="onConfirm">Обменять</UiButton>
			</div>
		</div>
	</UiDialog>
</template>

<style scoped>
.exchanges {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.exchanges__title {
	font: var(--type-h2);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
}

.layout {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 300px;
	gap: 20px;
	align-items: start;
}

.list {
	display: flex;
	flex-direction: column;
	gap: 16px;
	min-width: 0;
}

.card {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.card--off {
	opacity: 0.6;
}

.card__head {
	display: flex;
	align-items: center;
	gap: 12px;
}

.card__name {
	flex: 1;
	min-width: 0;
	font: var(--type-h4);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
}

.card__desc {
	font: var(--type-body-sm);
	color: var(--text-body);
	text-wrap: pretty;
}

.card__flow {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 24px minmax(0, 1fr);
	gap: 16px;
	align-items: center;
	padding-top: 12px;
	border-top: 1px solid var(--border-subtle);
}

.card__arrow {
	display: flex;
	justify-content: center;
	color: var(--text-subtle);
}

.card__why {
	font: var(--type-caption);
	color: var(--text-muted);
}

.side {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.pills {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.pill {
	display: flex;
	flex: none;
	align-items: center;
	height: 28px;
	padding: 0 12px;
	font: 500 13px / 1 var(--font-body);
	color: var(--text-strong);
	white-space: nowrap;
	border: var(--border-width) solid var(--border-strong);
	border-radius: var(--radius-pill);
}

.pill--short {
	color: var(--text-muted);
	border-style: dashed;
	border-color: var(--border-default);
}

.pill--get {
	font-weight: 600;
	background: var(--surface-sunken);
	border: 0;
}

.note {
	font: var(--type-body-sm);
	color: var(--text-muted);
}

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
}

.row__name--open {
	font-weight: 600;
}

.row__note {
	font: var(--type-caption);
	color: var(--text-subtle);
}

.row__value {
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

.dialog {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.dialog__table {
	display: flex;
	flex-direction: column;
}

.dialog__row {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 72px 24px 72px;
	gap: 8px;
	align-items: center;
	min-height: 36px;
	font: var(--type-body-sm);
	border-bottom: 1px solid var(--border-subtle);
}

.dialog__row--head {
	min-height: 0;
	padding-bottom: 8px;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.dialog__right {
	text-align: right;
}

.dialog__name {
	color: var(--text-strong);
}

.dialog__was {
	text-align: right;
	font: var(--type-mono);
	color: var(--text-muted);
}

.dialog__arrow {
	text-align: center;
	color: var(--text-subtle);
}

.dialog__now {
	text-align: right;
	font: 600 14px / 1 var(--font-mono);
	color: var(--text-strong);
}

.dialog__now--gain {
	color: var(--success-text);
}

.dialog__actions {
	display: flex;
	gap: 8px;
	justify-content: flex-end;
}
</style>
