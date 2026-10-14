<script setup lang="ts">
import { computed, onMounted } from 'vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiTabs from '../../components/ui/UiTabs.vue'
import { RouteName } from '../../router/routeNames'
import { useCurrentGameStore } from '../../stores/currentGameStore'
import { useWheelStore, type WheelTab } from '../../stores/wheelStore'
import { useWishlistStore } from '../../stores/wishlistStore'

const REEL_OFFSETS = [-3, -2, -1, 0, 1, 2, 3]
const PREVIEW_COUNT = 4

const currentGameStore = useCurrentGameStore()
const wheelStore = useWheelStore()
const wishlistStore = useWishlistStore()

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

	return n ? wheelStore.pool[wheelStore.pos % n] : 'Вишлист пуст'
})

const groupPreview = (names: string[]) =>
	names.slice(0, PREVIEW_COUNT).join(' · ') +
	(names.length > PREVIEW_COUNT ? ` · ещё ${names.length - PREVIEW_COUNT}` : '')

const isWishlistResult = computed(() => wheelStore.result?.source === 'wishlist')

const resultDescription = computed(() => {
	const result = wheelStore.result

	if (!result) return ''
	if (isWishlistResult.value) return 'Станет текущей игрой, таймер начнётся с нуля.'

	return result.result.description ?? `Эффект из группы «${wheelStore.resultSource}».`
})

onMounted(() => wheelStore.load())
</script>

<template>
	<div class="wheel">
		<div class="head">
			<span class="head__title">Колесо</span>
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

				<div v-if="wheelStore.tab === 'points'" class="groups">
					<div
						v-for="group in wheelStore.changeGroups"
						:key="group.id"
						class="group"
						:class="{ 'group--on': group.id === wheelStore.groupId }"
						@click="wheelStore.setGroup(group.id)"
					>
						<div class="group__row">
							<span class="group__radio">
								<span class="group__dot"></span>
							</span>
							<span class="group__name">{{ group.name }}</span>
							<span class="group__count">{{ group.entries.length }}</span>
						</div>
						<div v-if="group.id === wheelStore.groupId" class="group__preview">
							{{ groupPreview(group.entries.map((e) => e.name)) }}
						</div>
					</div>
				</div>

				<div v-else class="source">
					<span class="source__text">
						Твой вишлист:
						<span class="source__count">{{ wishlistStore.mine.length }}</span>
					</span>
					<span class="source__hint">Выпавшая игра станет текущей.</span>
					<RouterLink class="source__link" :to="{ name: RouteName.Games }">
						Открыть вишлист
					</RouterLink>
				</div>
			</div>

			<div class="main">
				<div class="reel">
					<div v-for="row in reel" :key="row.key" class="reel__row" :style="{ opacity: row.opacity }">
						{{ row.text }}
					</div>
					<div class="reel__center">{{ reelCenter }}</div>
				</div>

				<div class="spin">
					<UiButton
						size="lg"
						icon="refresh-cw"
						:disabled="wheelStore.spinning || !wheelStore.pool.length || gameInProgress"
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
							<span class="label">Выпало · {{ wheelStore.resultSource }}</span>
							<span class="result__name">{{ wheelStore.result.result.name }}</span>
						</div>
						<UiButton variant="secondary" @click="wheelStore.apply()">
							{{ isWishlistResult ? 'Взять игру' : 'Применить' }}
						</UiButton>
						<UiButton variant="outline" @click="wheelStore.clearResult()">Сбросить</UiButton>
					</div>

					<div class="result__body">
						<span class="result__desc">{{ resultDescription }}</span>
						<div v-if="wheelStore.result.result.isManualChange" class="result__manual">
							<UiBadge tone="info" dot>Вручную</UiBadge>
							<span>после применения нужно внести изменение вручную</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
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

.head__title {
	font: var(--type-h2);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
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

.group__preview {
	padding: 8px 0 0 32px;
	font: var(--type-caption);
	color: var(--text-muted);
}

.source {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 16px;
}

.source__text {
	font: var(--type-body-sm);
	color: var(--text-body);
}

.source__count {
	font: 600 14px / 1.45 var(--font-mono);
	color: var(--text-strong);
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

.label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
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

.result__manual {
	display: flex;
	align-items: center;
	gap: 8px;
	font: var(--type-caption);
	color: var(--text-muted);
}
</style>
