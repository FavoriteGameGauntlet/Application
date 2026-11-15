<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue'
import type { WheelGroup } from '../../api-facade/contracts'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiCountBadge from '../../components/ui/UiCountBadge.vue'
import UiIcon from '../../components/ui/UiIcon.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import UiTabs from '../../components/ui/UiTabs.vue'
import { RouteName } from '../../router/routeNames'
import { useCurrentGameStore } from '../../stores/currentGameStore'
import { useResourcesStore } from '../../stores/resourcesStore'
import { useWheelStore, type WheelTab } from '../../stores/wheelStore'
import { useWishlistStore } from '../../stores/wishlistStore'
import { formatCost, formatResource } from '../../utils/formatResource'
import { affordableSpins } from '../../utils/spinPayment'
import { useSessionStore } from '../../stores/sessionStore'
import { useToastStore } from '../../stores/toastStore'
import SpinEntriesDialog from './components/SpinEntriesDialog.vue'
import SpinPaymentDialog from './components/SpinPaymentDialog.vue'
import WheelTape from './components/WheelTape.vue'

const currentGameStore = useCurrentGameStore()
const resourcesStore = useResourcesStore()
const wheelStore = useWheelStore()
const wishlistStore = useWishlistStore()

/** «Билет на колесо ×2», «50 золота»: a fact each; none when the spin of the group is free */
const costRows = (group: WheelGroup) =>
	group.cost.map((r) => formatCost(r, resourcesStore.pointTypes))

const sessionStore = useSessionStore()

const spinsLeft = (group: WheelGroup) =>
	affordableSpins(group.cost ?? [], resourcesStore.byUser[sessionStore.login])

const sources = computed(() =>
	wheelStore.tab === 'games' ? wheelStore.gameGroups : wheelStore.changeGroups,
)

const groupName = (group: WheelGroup) =>
	group.kind === 'wishlist' ? 'Твой список желаемого' : group.name

const groupCount = (group: WheelGroup) =>
	group.kind === 'wishlist' ? wishlistStore.mine.length : group.entries.length

/** a game can't be spun while another one is being played */
const gameInProgress = computed(
	() => wheelStore.tab === 'games' && !!currentGameStore.current?.game,
)

const tabs = [
	{ value: 'points', label: 'Пункты' },
	{ value: 'games', label: 'Игры' },
]

const emptyText = computed(() => {
	switch (wheelStore.group?.kind) {
		case 'wishlist':
			return 'Список желаемого пуст'
		case 'games':
			return 'В группе нет игр'
		case 'changes':
			return 'В группе нет пунктов'
		default:
			return wheelStore.tab === 'games' ? 'Нет источников' : 'Нет групп'
	}
})

/** what the entry changes by itself: green adds, red takes */
const resultChanges = computed(() =>
	(wheelStore.resultEntry?.entries ?? []).map((r) => ({
		text: r.text ?? formatResource(r, resourcesStore.pointTypes),
		// a perk has no amount, its sign lives only in the text
		tone: r.text?.startsWith('−') ? 'minus' : 'plus',
	})),
)

const showResult = computed(
	() => !!wheelStore.shownResult && !wheelStore.spinning && !wheelStore.loading,
)

// the tickets count the spins the user's resources pay for; set up here, not in
// onMounted, so the first frame is already the empty one
resourcesStore.loadMine().catch((e) => useToastStore().error(e))
wheelStore.open()

// a spin must not hang when the tape is gone before it lands
onBeforeUnmount(() => wheelStore.landed())
</script>

<template>
	<div class="wheel">
		<div class="head">
			<UiPageTitle>Колесо</UiPageTitle>
			<UiTabs
				:model-value="wheelStore.tab"
				:items="tabs"
				@update:model-value="wheelStore.setTab($event as WheelTab)"
			/>
		</div>

		<div class="tickets">
			<div v-for="group in sources" :key="group.id" class="ticket">
				<button
					type="button"
					class="ticket__button"
					:class="{
						'ticket__button--on': group.id === wheelStore.group?.id,
						'ticket__button--off':
							wheelStore.spinning && group.id !== wheelStore.group?.id,
					}"
					:aria-pressed="group.id === wheelStore.group?.id"
					:disabled="wheelStore.spinning"
					@click="wheelStore.setGroup(group.id)"
				>
					<span class="ticket__bar"></span>
					<span class="ticket__head">
						<span class="ticket__name">{{ groupName(group) }}</span>
						<UiCountBadge :value="groupCount(group)" />
					</span>
					<span class="ticket__tags">
						<template v-if="group.cost.length">
							<span
								v-for="row in costRows(group)"
								:key="row"
								class="change change--minus"
								>−{{ row }}</span
							>
						</template>
						<span v-else class="change change--plus">бесплатно</span>
					</span>
					<span class="ticket__tags">
						<UiBadge :tone="spinsLeft(group) === 0 ? 'danger' : 'neutral'">
							Прокрутов: {{ spinsLeft(group) ?? '∞' }}
						</UiBadge>
					</span>
				</button>
				<RouterLink
					v-if="group.kind === 'wishlist'"
					class="ticket__link"
					:to="{ name: RouteName.Games }"
					aria-label="Открыть список желаемого"
					title="Открыть список желаемого"
				>
					<UiIcon name="arrow-right" :size="16" />
				</RouterLink>
			</div>
		</div>

		<WheelTape
			:entries="wheelStore.pool"
			:target="wheelStore.landing?.resultIndex"
			:winner="showResult ? wheelStore.shownResult?.resultIndex : undefined"
			:busy="gameInProgress"
			:loading="wheelStore.loading"
			:empty-text="emptyText"
			@landed="wheelStore.landed()"
		/>

		<div class="spin">
			<UiButton
				size="lg"
				icon="refresh-cw"
				:variant="showResult ? 'outline' : 'primary'"
				:disabled="
					wheelStore.spinning ||
					wheelStore.loading ||
					!wheelStore.pool.length ||
					gameInProgress
				"
				@click="wheelStore.spin()"
			>
				{{ wheelStore.spinning ? 'Крутится…' : 'Крутить колесо' }}
			</UiButton>
		</div>

		<Transition name="result">
			<div v-if="showResult && wheelStore.result" class="result">
				<span class="result__accent"></span>

				<div class="result__body">
					<div class="result__name">{{ wheelStore.result.result.name }}</div>
					<div v-if="wheelStore.result.result.description" class="result__desc">
						{{ wheelStore.result.result.description }}
					</div>
					<div v-if="resultChanges.length" class="result__changes">
						<span
							v-for="(change, i) in resultChanges"
							:key="i"
							class="change"
							:class="`change--${change.tone}`"
							>{{ change.text }}</span
						>
					</div>
					<div
						v-if="wheelStore.result.result.isManualChange"
						class="result__manual"
					>
						<UiBadge tone="info" dot>Ручное изменение</UiBadge>
						<span>после применения нужно внести ручное изменение</span>
					</div>
				</div>

				<div class="result__actions">
					<UiButton variant="outline" @click="wheelStore.discardResult()">
						Сбросить
					</UiButton>
					<UiButton @click="wheelStore.apply()">
						{{ wheelStore.resultStartsGame ? 'Взять игру' : 'Применить' }}
					</UiButton>
				</div>
			</div>
		</Transition>
	</div>

	<SpinEntriesDialog
		:entries="wheelStore.pendingEntries"
		@close="wheelStore.cancelEntries()"
		@confirm="wheelStore.confirmEntries($event)"
	/>

	<SpinPaymentDialog
		:choices="wheelStore.pendingChoices"
		@close="wheelStore.cancelPayment()"
		@confirm="wheelStore.confirmPayment($event)"
	/>
</template>

<style scoped>
.wheel {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.head {
	display: flex;
	align-items: flex-end;
	gap: 32px;
}

.tickets {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 16px;
}

.ticket {
	position: relative;
	display: flex;
	min-width: 0;
}

.ticket__button {
	position: relative;
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
	padding: 14px 16px;
	font: inherit;
	color: inherit;
	text-align: left;
	cursor: pointer;
	background: var(--surface-card);
	border: 1.5px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.ticket__button:disabled {
	cursor: default;
}

.ticket__button--on {
	border-color: var(--border-strong);
}

.ticket__button--off {
	opacity: 0.5;
}

.ticket__bar {
	position: absolute;
	top: -1.5px;
	left: 16px;
	width: 0;
	height: 4px;
	background: var(--accent);
	border-radius: 0 0 2px 2px;
}

.ticket__button--on .ticket__bar {
	width: 40px;
}

/* a long name keeps its width and the count drops under it */
.ticket__head {
	display: flex;
	flex-wrap: wrap;
	gap: 6px 12px;
	align-items: center;
	justify-content: space-between;
}

.ticket__name {
	min-width: 0;
	font: 700 var(--fs-14) / var(--lh-snug) var(--font-display);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
}

/* the room on the right is for the link of the wishlist */
.ticket__tags {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	padding-right: 36px;
}

.ticket__link {
	position: absolute;
	right: 12px;
	bottom: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	width: 28px;
	height: 28px;
	color: var(--text-muted);
	border: 1.5px solid var(--border-default);
	border-radius: var(--radius-sm);
}

.ticket__link:hover {
	color: var(--text-strong);
	border-color: var(--border-strong);
}

.spin {
	display: flex;
	flex-direction: column;
	gap: 10px;
	align-items: center;
}

.result {
	position: relative;
	display: flex;
	flex-wrap: wrap;
	gap: 24px;
	align-items: center;
	padding: 20px;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.result__accent {
	position: absolute;
	top: 0;
	left: 20px;
	width: 40px;
	height: 4px;
	background: var(--accent);
	border-radius: 0 0 2px 2px;
}

.result__body {
	display: flex;
	flex: 1 1 420px;
	flex-direction: column;
	gap: 8px;
	min-width: 0;
}

.result__name {
	font: var(--type-h3);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
}

.result__desc {
	font: var(--type-body-sm);
	color: var(--text-body);
}

.result__changes {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.change {
	display: inline-flex;
	align-items: center;
	min-height: 26px;
	padding: 0 10px;
	font: 500 var(--fs-12) / 1.2 var(--font-body);
	color: var(--text-body);
	background: var(--surface-sunken);
	border-radius: var(--radius-pill);
}

.change--plus {
	color: var(--success-text);
	background: var(--success-soft);
}

.change--minus {
	color: var(--danger-text);
	background: var(--danger-soft);
}

.result__manual {
	display: flex;
	align-items: center;
	gap: 8px;
	font: var(--type-caption);
	color: var(--text-muted);
}

.result__actions {
	display: flex;
	flex: none;
	align-items: center;
	gap: 8px;
}

.result-enter-active {
	transition:
		opacity 240ms var(--ease-out),
		transform 320ms var(--ease-out);
}

.result-enter-from {
	opacity: 0;
	transform: translateY(12px);
}
</style>
