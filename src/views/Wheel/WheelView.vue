<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { WheelGroup } from '../../api-facade/contracts'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import UiTabs from '../../components/ui/UiTabs.vue'
import { RouteName } from '../../router/routeNames'
import { useCurrentGameStore } from '../../stores/currentGameStore'
import { useResourcesStore } from '../../stores/resourcesStore'
import { useWheelStore, type WheelTab } from '../../stores/wheelStore'
import { useWishlistStore } from '../../stores/wishlistStore'
import { formatCost } from '../../utils/formatResource'
import SpinEntriesDialog from './components/SpinEntriesDialog.vue'
import SpinPaymentDialog from './components/SpinPaymentDialog.vue'

const REEL_OFFSETS = [-3, -2, -1, 0, 1, 2, 3]

const currentGameStore = useCurrentGameStore()
const resourcesStore = useResourcesStore()
const wheelStore = useWheelStore()
const wishlistStore = useWishlistStore()

/** «Билет на колесо ×2, 50 золота»; empty when the spin of the group is free */
const costText = (group?: WheelGroup) =>
	(group?.cost ?? [])
		.map((r) => formatCost(r, resourcesStore.pointTypes))
		.join(', ')

/** the cost is charged when the result is applied */
const resultCost = computed(() => {
	const source = wheelStore.result?.source

	if (!source) return ''

	return costText(wheelStore.groups.find((g) => g.id === source.groupId))
})

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

const reel = computed(() => {
	const pool = wheelStore.pool
	const n = pool.length

	return REEL_OFFSETS.map((k) => ({
		key: k,
		text: n ? pool[(((wheelStore.pos + k) % n) + n) % n] : '',
		opacity: k === 0 ? 0 : 1 - Math.abs(k) * 0.22,
	}))
})

const reelCenter = computed(() => {
	const n = wheelStore.pool.length

	if (n) return wheelStore.pool[wheelStore.pos % n]

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

const resultDescription = computed(() => {
	const result = wheelStore.result

	if (!result) return ''
	if (wheelStore.resultStartsGame)
		return 'Станет текущей игрой, таймер начнётся с нуля.'

	return (
		result.result.description ??
		`Эффект из группы «${wheelStore.resultSource}».`
	)
})

onMounted(async () => {
	await wheelStore.load()
	await wheelStore.restore()
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

		<div class="body">
			<div class="panel">
				<div class="panel__title">
					{{ wheelStore.tab === 'games' ? 'Источник' : 'Группа' }}
				</div>

				<div class="groups">
					<div
						v-for="group in sources"
						:key="group.id"
						class="group"
						:class="{ 'group--on': group.id === wheelStore.group?.id }"
						@click="wheelStore.setGroup(group.id)"
					>
						<div class="group__row">
							<span class="group__radio">
								<span class="group__dot"></span>
							</span>
							<span class="group__name">{{ groupName(group) }}</span>
							<span class="group__count">{{ groupCount(group) }}</span>
						</div>
						<div class="group__cost">
							{{ costText(group) ? `Цена: ${costText(group)}` : 'Бесплатно' }}
						</div>
					</div>
				</div>

				<div v-if="wheelStore.tab === 'games'" class="source">
					<span class="source__hint">Выпавшая игра станет текущей.</span>
					<RouterLink
						v-if="wheelStore.group?.kind === 'wishlist'"
						class="source__link"
						:to="{ name: RouteName.Games }"
					>
						Открыть список желаемого
					</RouterLink>
				</div>
			</div>

			<div class="main">
				<div class="reel">
					<div
						v-for="row in reel"
						:key="row.key"
						class="reel__row"
						:style="{ opacity: row.opacity }"
					>
						{{ row.text }}
					</div>
					<div class="reel__center">{{ reelCenter }}</div>
				</div>

				<div class="spin">
					<UiButton
						size="lg"
						icon="refresh-cw"
						:disabled="
							wheelStore.spinning || !wheelStore.pool.length || gameInProgress
						"
						@click="wheelStore.spin()"
					>
						{{ wheelStore.spinning ? 'Крутится…' : 'Крутить колесо' }}
					</UiButton>
					<span v-if="gameInProgress" class="spin__hint">
						Идёт игра. Колесо игр можно крутить, когда она закончена.
					</span>
				</div>

				<div v-if="wheelStore.result && !wheelStore.spinning" class="result">
					<span class="result__accent"></span>

					<div class="result__head">
						<div class="result__title">
							<span class="result__name">{{
								wheelStore.result.result.name
							}}</span>
						</div>
						<UiButton variant="secondary" @click="wheelStore.apply()">
							{{ wheelStore.resultStartsGame ? 'Взять игру' : 'Применить' }}
						</UiButton>
						<UiButton variant="outline" @click="wheelStore.discardResult()"
							>Сбросить</UiButton
						>
					</div>

					<div class="result__body">
						<span class="result__desc">{{ resultDescription }}</span>
						<span v-if="resultCost" class="result__cost">
							Спишется при применении: {{ resultCost }}
						</span>
						<div
							v-if="wheelStore.result.result.isManualChange"
							class="result__manual"
						>
							<UiBadge tone="info" dot>Ручное изменение</UiBadge>
							<span>после применения нужно внести ручное изменение</span>
						</div>
					</div>
				</div>
			</div>
		</div>
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
	gap: 24px;
}

.head {
	display: flex;
	align-items: flex-end;
	gap: 32px;
}

.body {
	display: flex;
	align-items: flex-start;
	gap: 32px;
}

.panel {
	flex: none;
	width: 320px;
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.panel__title {
	padding: 14px 16px;
	font: var(--type-h4);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
	background: var(--surface-sunken);
}

.groups {
	display: flex;
	flex-direction: column;
	gap: 2px;
	padding: 4px;
}

.group {
	padding: 12px;
	border-radius: var(--radius-sm);
	cursor: pointer;
}

.group:hover,
.group--on {
	background: var(--surface-sunken);
}

.group__row {
	display: flex;
	align-items: center;
	gap: 12px;
}

.group__radio {
	display: flex;
	flex: none;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	border: 2px solid var(--border-default);
	border-radius: var(--radius-pill);
}

.group--on .group__radio {
	border-color: var(--border-strong);
}

.group__dot {
	width: 10px;
	height: 10px;
	border-radius: var(--radius-pill);
	background: transparent;
}

.group--on .group__dot {
	background: var(--accent);
}

.group__name {
	flex: 1;
	font: var(--type-body-sm);
	color: var(--text-strong);
}

.group--on .group__name {
	font-weight: 600;
}

.group__count {
	font: var(--type-mono);
	color: var(--text-subtle);
}

.group__cost {
	padding: 4px 0 0 32px;
	font: var(--type-caption);
	color: var(--text-muted);
}

.source {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 16px;
}

.source__hint {
	font: var(--type-caption);
	color: var(--text-muted);
}

.source__link {
	align-self: flex-start;
	margin-top: 4px;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
}

.main {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 16px;
	max-width: 520px;
}

.reel {
	position: relative;
	padding: 4px 0;
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.reel__row {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 40px;
	font: var(--type-body-sm);
	color: var(--text-subtle);
}

.reel__center {
	position: absolute;
	top: 124px;
	right: 12px;
	left: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 40px;
	font: var(--type-h4);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-on-contrast);
	background: var(--surface-contrast);
	border-radius: var(--radius-sm);
}

.spin {
	display: flex;
	flex-direction: column;
	gap: 8px;
	align-items: center;
	align-self: center;
}

.spin__hint {
	font: var(--type-body-sm);
	color: var(--text-muted);
}

.result {
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.result__accent {
	position: absolute;
	top: 0;
	left: 16px;
	width: 40px;
	height: 4px;
	background: var(--accent);
	border-radius: 0 0 2px 2px;
}

.result__head {
	display: flex;
	align-items: center;
	gap: 8px;
}

.result__title {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 6px;
}

.result__name {
	font: var(--type-h4);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
}

.result__body {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding-top: 12px;
	border-top: 1px solid var(--border-subtle);
}

.result__desc {
	font: var(--type-body-sm);
	color: var(--text-body);
}

.result__cost {
	font: var(--type-body-sm);
	color: var(--text-muted);
}

.result__manual {
	display: flex;
	align-items: center;
	gap: 8px;
	font: var(--type-caption);
	color: var(--text-muted);
}
</style>
