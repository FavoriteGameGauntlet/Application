<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Exchange, ResourceRef } from '../../api-facade/contracts'
import UserResourcesPanel from '../../components/UserResourcesPanel.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiDialog from '../../components/ui/UiDialog.vue'
import UiIcon from '../../components/ui/UiIcon.vue'
import { useExchangesStore } from '../../stores/exchangesStore'
import { useResourcesStore } from '../../stores/resourcesStore'
import { useSessionStore } from '../../stores/sessionStore'
import { formatResource } from '../../utils/formatResource'
import { countItems } from '../../utils/userItems'

const exchangesStore = useExchangesStore()
const resourcesStore = useResourcesStore()
const sessionStore = useSessionStore()

const confirming = ref<Exchange>()

const selectedUser = ref(sessionStore.login)

const mine = computed(() => resourcesStore.byUser[sessionStore.login])

const text = (ref: ResourceRef) => formatResource(ref, resourcesStore.pointTypes)

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
			name: ref.name,
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

			<UserResourcesPanel v-model:user="selectedUser" />
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
