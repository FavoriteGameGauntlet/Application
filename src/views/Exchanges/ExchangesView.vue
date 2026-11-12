<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { ExchangeOffer, ResourceRef } from '../../api-facade/contracts'
import UserResourcesPanel from '../../components/UserResourcesPanel.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiCheckbox from '../../components/ui/UiCheckbox.vue'
import UiDialog from '../../components/ui/UiDialog.vue'
import UiIcon from '../../components/ui/UiIcon.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import { useExchangesStore } from '../../stores/exchangesStore'
import { useResourcesStore } from '../../stores/resourcesStore'
import { useSessionStore } from '../../stores/sessionStore'
import { formatResource } from '../../utils/formatResource'
import { countItems } from '../../utils/userItems'

const exchangesStore = useExchangesStore()
const resourcesStore = useResourcesStore()
const sessionStore = useSessionStore()

const confirming = ref<ExchangeOffer>()
/** the `entryId`s the user picked on a side that doesn't apply all its entries */
const pickedSource = ref<number[]>([])
const pickedTarget = ref<number[]>([])

const open = (exchange: ExchangeOffer) => {
	pickedSource.value = []
	pickedTarget.value = []
	confirming.value = exchange
}

const toggle = (side: 'source' | 'target', entryId: number, on: boolean) => {
	const picked = side === 'source' ? pickedSource : pickedTarget

	picked.value = on
		? [...picked.value, entryId]
		: picked.value.filter((x) => x !== entryId)
}

/** the entries of a side that the exchange applies */
const applied = (refs: ResourceRef[], all: boolean, picked: number[]) =>
	all
		? refs
		: refs.filter((r) => r.entryId !== undefined && picked.includes(r.entryId))

const choosesSource = computed(
	() => confirming.value?.sourceShouldApplyToAll === false,
)
const choosesTarget = computed(
	() => confirming.value?.targetShouldApplyToAll === false,
)

const canConfirm = computed(
	() =>
		(!choosesSource.value || pickedSource.value.length > 0) &&
		(!choosesTarget.value || pickedTarget.value.length > 0),
)

const selectedUser = ref(sessionStore.login)

const mine = computed(() => resourcesStore.byUser[sessionStore.login])

const text = (ref: ResourceRef) =>
	formatResource(ref, resourcesStore.pointTypes)

/** how many of the resource the current user has */
const have = (ref: ResourceRef) => {
	if (ref.kind === 'points') return mine.value?.points[ref.id] ?? 0
	if (ref.kind === 'item') {
		return countItems(mine.value?.items ?? [], ref.id)
	}

	return 0
}

const amountOf = (ref: ResourceRef) =>
	ref.kind === 'points' || ref.kind === 'item' ? ref.amount : 0

const cards = computed(() =>
	exchangesStore.list.map((exchange) => ({
		exchange,
		give: exchange.sourceEntries.map((ref) => {
			const enough = have(ref) >= amountOf(ref)

			return {
				text: enough ? text(ref) : `${text(ref)} (${have(ref)})`,
				enough,
			}
		}),
		get: exchange.targetEntries.map(text),
	})),
)

const confirmRows = computed(() => {
	const exchange = confirming.value

	if (!exchange) return []

	return [
		...applied(
			exchange.sourceEntries,
			exchange.sourceShouldApplyToAll,
			pickedSource.value,
		).map((ref) => ({ ref, sign: -1 })),
		...applied(
			exchange.targetEntries,
			exchange.targetShouldApplyToAll,
			pickedTarget.value,
		).map((ref) => ({ ref, sign: 1 })),
	].map(({ ref, sign }) => {
		if (ref.kind === 'perk') {
			return {
				name: `Перк «${ref.name}»`,
				delta: '+1',
				was: 'нет',
				now: 'есть',
				gain: true,
			}
		}

		const was = have(ref)

		return {
			name: ref.name,
			delta: `${sign > 0 ? '+' : '−'}${amountOf(ref)}`,
			was,
			now: was + sign * amountOf(ref),
			gain: sign > 0,
		}
	})
})

const onConfirm = async () => {
	const exchange = confirming.value

	confirming.value = undefined

	if (exchange) {
		await exchangesStore.execute(exchange, {
			...(exchange.sourceShouldApplyToAll === false && {
				sourceEntryIds: pickedSource.value,
			}),
			...(exchange.targetShouldApplyToAll === false && {
				targetEntryIds: pickedTarget.value,
			}),
		})
	}
}

onMounted(() => exchangesStore.load())
</script>

<template>
	<div class="exchanges">
		<UiPageTitle>Обмены</UiPageTitle>

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
							@click="open(card.exchange)"
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
								<span
									v-for="pill in card.get"
									:key="pill"
									class="pill pill--get"
								>
									{{ pill }}
								</span>
							</div>
						</div>
					</div>

					<span
						v-if="card.exchange.unavailableReason === 'perk_owned'"
						class="card__why"
					>
						Перк уже есть, второй раз не купить.
					</span>
				</div>
			</div>

			<UserResourcesPanel v-model:user="selectedUser" />
		</div>
	</div>

	<UiDialog
		:open="!!confirming"
		title="Обменять?"
		:subtitle="confirming?.name"
		:width="480"
		@close="confirming = undefined"
	>
		<div class="dialog">
			<div v-if="choosesSource" class="dialog__pick">
				<span class="label">Что отдать</span>
				<UiCheckbox
					v-for="entry in confirming?.sourceEntries"
					:key="entry.entryId"
					:label="text(entry)"
					:model-value="pickedSource.includes(entry.entryId!)"
					@update:model-value="toggle('source', entry.entryId!, $event)"
				/>
			</div>

			<div v-if="choosesTarget" class="dialog__pick">
				<span class="label">Что получить</span>
				<UiCheckbox
					v-for="entry in confirming?.targetEntries"
					:key="entry.entryId"
					:label="text(entry)"
					:model-value="pickedTarget.includes(entry.entryId!)"
					@update:model-value="toggle('target', entry.entryId!, $event)"
				/>
			</div>

			<div class="dialog__table" role="table" aria-label="Что изменится">
				<span class="label">Ресурс</span>
				<span class="label dialog__right">Изменится</span>
				<span class="label dialog__right">У тебя</span>
				<template v-for="row in confirmRows" :key="row.name">
					<span class="dialog__name">{{ row.name }}</span>
					<span
						class="dialog__right dialog__delta"
						:class="row.gain ? 'dialog__delta--gain' : 'dialog__delta--loss'"
						>{{ row.delta }}</span
					>
					<span class="dialog__right dialog__was"
						>{{ row.was }} →
						<span class="dialog__now">{{ row.now }}</span></span
					>
				</template>
			</div>
		</div>

		<template #footer>
			<UiButton variant="ghost" @click="confirming = undefined"
				>Отмена</UiButton
			>
			<UiButton :disabled="!canConfirm" @click="onConfirm">Обменять</UiButton>
		</template>
	</UiDialog>
</template>

<style scoped>
.exchanges {
	display: flex;
	flex-direction: column;
	gap: 16px;
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

.dialog {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.dialog__pick {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.dialog__table {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto auto;
	align-items: center;
}

.dialog__table > * {
	display: flex;
	align-items: center;
	min-height: 44px;
	border-bottom: 1px solid var(--border-subtle);
}

/* the last row has nothing under it */
.dialog__table > :nth-last-child(-n + 3) {
	border-bottom: 0;
}

.dialog__right {
	justify-content: flex-end;
	padding-left: 24px;
	white-space: nowrap;
}

.dialog__name {
	font-weight: 600;
	color: var(--text-strong);
}

.dialog__delta,
.dialog__was {
	font: 500 14px / 1 var(--font-mono);
	font-variant-numeric: tabular-nums;
}

.dialog__delta {
	font-weight: 600;
}

.dialog__delta--gain {
	color: var(--success-text);
}

.dialog__delta--loss {
	color: var(--danger-text);
}

.dialog__was {
	color: var(--text-muted);
}

.dialog__now {
	margin-left: 6px;
	color: var(--text-strong);
}
</style>
