<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { WheelGroup } from '../../api-facade/contracts'
import RewardPopover from '../../components/RewardPopover.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiChange from '../../components/ui/UiChange.vue'
import UiCountBadge from '../../components/ui/UiCountBadge.vue'
import UiIcon from '../../components/ui/UiIcon.vue'
import UiIconButton from '../../components/ui/UiIconButton.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import UiTabs from '../../components/ui/UiTabs.vue'
import { RouteName } from '../../router/routeNames'
import { useCurrentGameStore } from '../../stores/currentGameStore'
import { useResourcesStore } from '../../stores/resourcesStore'
import { useWheelStore, type WheelTab } from '../../stores/wheelStore'
import { useWishlistStore } from '../../stores/wishlistStore'
import {
	formatCost,
	formatResource,
	type Change,
} from '../../utils/formatResource'
import { affordableSpins } from '../../utils/payment'
import { useSessionStore } from '../../stores/sessionStore'
import { useToastStore } from '../../stores/toastStore'
import SpinEntriesDialog from './components/SpinEntriesDialog.vue'
import PaymentDialog from '../../components/PaymentDialog.vue'
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
const resultChanges = computed<Change[]>(() =>
	(wheelStore.resultEntry?.entries ?? []).map((r) => ({
		text: r.text ?? formatResource(r, resourcesStore.pointTypes),
		// a perk has no amount, its sign lives only in the text
		tone: r.text?.startsWith('−') ? 'minus' : 'plus',
	})),
)

const showResult = computed(
	() => !!wheelStore.shownResult && !wheelStore.spinning && !wheelStore.loading,
)

/** the result keeps what it does to itself until the player opens it, as in the generator the testers know */
const resultOpen = ref(false)

const resultHasBody = computed(
	() =>
		!!wheelStore.result?.result.description ||
		resultChanges.value.length > 0 ||
		!!wheelStore.result?.result.isManualChange,
)

const resultClosed = computed(() => resultHasBody.value && !resultOpen.value)

// every new result, another group and a new visit of the screen start closed
watch(
	() => wheelStore.shownResult,
	() => {
		resultOpen.value = false
	},
)

const onResultAction = () => {
	if (resultClosed.value) resultOpen.value = true
	else wheelStore.apply()
}

// the tickets count the spins the user's resources pay for; set up here, not in
// onMounted, so the first frame is already the empty one
resourcesStore.loadMine().catch((e) => useToastStore().error(e))
wheelStore.open()

/** the width of a ticket and the gap after it, the buttons of the strip move by one ticket */
const TICKET_STEP = 280

const ticketsEl = ref<HTMLElement>()
const canPrev = ref(false)
const canNext = ref(false)

const updateStrip = () => {
	const el = ticketsEl.value

	if (!el) return

	canPrev.value = el.scrollLeft > 1
	canNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

type CostTip = { changes: Change[]; style: { left: string; top: string } }

const COST_TIP_WIDTH = 240
const COST_TIP_GAP = 6

const stripEl = ref<HTMLElement>()

/** the whole cost of a ticket in the form of the timer reward, shown at once while the pointer is on the cost row */
const costTip = ref<CostTip | null>(null)

/**
 * The tip lives in the strip, so it is placed from the offsets of the row, which are layout
 * units like the tip's own. The interface scale is a CSS zoom, and a mouse event or a
 * rectangle may be in screen pixels instead, which put a `fixed` tip off by the scale.
 */
const costTipStyle = (row: HTMLElement) => {
	const strip = stripEl.value
	const tickets = ticketsEl.value

	if (!strip || !tickets) return null

	let left = 0
	let top = 0

	for (
		let el: HTMLElement | null = row;
		el && el !== strip;
		el = el.offsetParent as HTMLElement | null
	) {
		left += el.offsetLeft
		top += el.offsetTop
	}

	// the offsets ignore the scroll of the ticket row, which moves the tickets under the strip
	left -= tickets.scrollLeft

	return {
		left: `${Math.max(0, Math.min(left, strip.clientWidth - COST_TIP_WIDTH))}px`,
		top: `${top + row.offsetHeight + COST_TIP_GAP}px`,
	}
}

const showCost = (e: MouseEvent, group: WheelGroup) => {
	// one item is already on the ticket in full
	if (group.cost.length < 2) return

	const style = costTipStyle(e.currentTarget as HTMLElement)

	if (!style) return

	costTip.value = {
		changes: costRows(group).map((text) => ({
			text: `−${text}`,
			tone: 'minus',
		})),
		style,
	}
}

const hideCost = () => {
	costTip.value = null
}

// the tip is placed once, so it would hang in the air while the strip moves
const onStripScroll = () => {
	hideCost()
	updateStrip()
}

const scrollStrip = (direction: -1 | 1) =>
	ticketsEl.value?.scrollBy({
		left: direction * TICKET_STEP,
		behavior: 'smooth',
	})

// the wheel of a mouse moves the strip sideways, a touchpad does it by itself
const onStripWheel = (e: WheelEvent) => {
	const el = ticketsEl.value

	if (!el || el.scrollWidth <= el.clientWidth) return

	if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return

	e.preventDefault()
	el.scrollLeft += e.deltaY
}

const revealSelected = () =>
	ticketsEl.value?.querySelector('[aria-pressed="true"]')?.scrollIntoView({
		inline: 'nearest',
		block: 'nearest',
		behavior: 'smooth',
	})

// after the tickets are drawn: the selected one comes into view, the buttons follow
watch(
	() => [wheelStore.group?.id, wheelStore.tab, wheelStore.loading],
	() => {
		revealSelected()
		updateStrip()
	},
	{ flush: 'post' },
)

let stripObserver: ResizeObserver | undefined

onMounted(() => {
	if (!ticketsEl.value) return

	stripObserver = new ResizeObserver(updateStrip)
	stripObserver.observe(ticketsEl.value)
})

// a spin must not hang when the tape is gone before it lands
onBeforeUnmount(() => {
	stripObserver?.disconnect()
	wheelStore.landed()
})
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

		<div ref="stripEl" class="strip">
			<UiIconButton
				v-if="canPrev || canNext"
				icon="chevron-left"
				variant="outline"
				label="Назад"
				:disabled="!canPrev"
				@click="scrollStrip(-1)"
			/>
			<div
				ref="ticketsEl"
				class="tickets"
				@scroll="onStripScroll"
				@wheel="onStripWheel"
			>
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
						<span
							class="ticket__name"
							:class="{ 'ticket__name--link': group.kind === 'wishlist' }"
							:title="groupName(group)"
							>{{ groupName(group) }}</span
						>
						<span
							class="ticket__cost"
							@mouseenter="showCost($event, group)"
							@mouseleave="hideCost"
						>
							<template v-if="group.cost.length">
								<UiChange tone="minus" class="ticket__pill"
									><span class="ticket__ellipsis"
										>−{{ costRows(group)[0] }}</span
									></UiChange
								>
								<UiChange v-if="group.cost.length > 1" class="ticket__more"
									>+{{ group.cost.length - 1 }}</UiChange
								>
							</template>
							<UiChange v-else tone="plus">бесплатно</UiChange>
						</span>
						<span class="ticket__meta">
							<UiCountBadge :value="groupCount(group)" />
							<UiBadge>Прокрутов: {{ spinsLeft(group) ?? '∞' }}</UiBadge>
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
			<UiIconButton
				v-if="canPrev || canNext"
				icon="chevron-right"
				variant="outline"
				label="Вперёд"
				:disabled="!canNext"
				@click="scrollStrip(1)"
			/>
			<!-- beside the scrolling row of tickets, which clips what sticks out of it -->
			<RewardPopover
				v-if="costTip"
				class="cost-tip"
				title="Цена прокрута"
				:changes="costTip.changes"
				:style="costTip.style"
			/>
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

				<div class="result__head">
					<div class="result__name">{{ wheelStore.result.result.name }}</div>
					<div class="result__actions">
						<UiButton
							variant="outline"
							class="result__action"
							@click="wheelStore.discardResult()"
						>
							Сбросить
						</UiButton>
						<UiButton class="result__action" @click="onResultAction">
							{{
								resultClosed
									? 'Показать'
									: wheelStore.resultStartsGame
										? 'Взять игру'
										: 'Применить'
							}}
						</UiButton>
					</div>
				</div>

				<button
					v-if="resultClosed"
					type="button"
					class="result__spoiler"
					aria-label="Показать"
					@click="resultOpen = true"
				>
					<UiIcon name="eye-off" :size="24" />
				</button>
				<div v-else-if="resultHasBody" class="result__body">
					<div v-if="wheelStore.result.result.description" class="result__desc">
						{{ wheelStore.result.result.description }}
					</div>
					<div v-if="resultChanges.length" class="result__changes">
						<UiChange
							v-for="(change, i) in resultChanges"
							:key="i"
							:tone="change.tone"
							>{{ change.text }}</UiChange
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
			</div>
		</Transition>
	</div>

	<SpinEntriesDialog
		:entries="wheelStore.pendingEntries"
		:apply-mode="wheelStore.resultEntry?.applyMode"
		@close="wheelStore.cancelEntries()"
		@confirm="wheelStore.confirmEntries($event)"
	/>

	<PaymentDialog
		subject="Прокрут"
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

.strip {
	position: relative;
	display: flex;
	gap: 12px;
	align-items: center;
}

/* the padding keeps the shadow and the bar of a ticket inside the scroll box, the margin takes it back */
.tickets {
	display: flex;
	flex: 1;
	gap: 16px;
	min-width: 0;
	padding: 6px 2px 10px;
	margin: -6px -2px -10px;
	overflow-x: auto;
	scrollbar-width: none;
}

.tickets::-webkit-scrollbar {
	display: none;
}

.ticket {
	position: relative;
	display: flex;
	flex: none;
	width: 264px;
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

/* two lines are always reserved, so the cost and the tags stand at the same place on every ticket */
.ticket__name {
	display: -webkit-box;
	height: calc(2 * var(--fs-14) * var(--lh-snug));
	overflow: hidden;
	font: 700 var(--fs-14) / var(--lh-snug) var(--font-display);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

/* the room on the right is for the link of the wishlist */
.ticket__name--link {
	padding-right: 36px;
}

/* one row whatever the cost: the first item and the count of the rest */
.ticket__cost {
	display: flex;
	gap: 6px;
	align-items: center;
	min-width: 0;
}

.ticket__pill {
	min-width: 0;
	max-width: 100%;
}

.ticket__ellipsis {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.ticket__more {
	flex: none;
}

/* the pointer passes through, so the tip never takes the hover from the row */
.cost-tip {
	position: absolute;
	z-index: 10;
	pointer-events: none;
}

.ticket__meta {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin-top: auto;
}

.ticket__link {
	position: absolute;
	top: 10px;
	right: 12px;
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
	flex-direction: column;
	gap: 12px;
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

/* the buttons stand opposite the name and never move when the body opens */
.result__head {
	display: flex;
	gap: 24px;
	align-items: center;
}

.result__name {
	flex: 1;
	min-width: 0;
	font: var(--type-h3);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
}

.result__actions {
	display: flex;
	flex: none;
	align-items: center;
	gap: 8px;
}

/* both buttons share one width, whatever the label */
.result__action {
	width: 136px;
}

.result__body {
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-width: 0;
}

/* one plate for every entry: neither its size nor its colour tells what is under it */
.result__spoiler {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 64px;
	padding: 0;
	color: var(--text-subtle);
	cursor: pointer;
	background: var(--surface-sunken);
	border: none;
	border-radius: var(--radius-md);
}

.result__spoiler:hover {
	color: var(--text-muted);
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

.result__manual {
	display: flex;
	align-items: center;
	gap: 8px;
	font: var(--type-caption);
	color: var(--text-muted);
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
