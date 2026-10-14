<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ItemStack, ResourceKind } from '../../../api-facade/contracts'
import UiBadge from '../../../components/ui/UiBadge.vue'
import UiButton from '../../../components/ui/UiButton.vue'
import UiIcon from '../../../components/ui/UiIcon.vue'
import UiInput from '../../../components/ui/UiInput.vue'
import UiPlayerAvatar from '../../../components/ui/UiPlayerAvatar.vue'
import { useJournalStore } from '../../../stores/journalStore'
import { useMembersStore } from '../../../stores/membersStore'
import { useResourcesStore } from '../../../stores/resourcesStore'
import { useSessionStore } from '../../../stores/sessionStore'
import { formatRemaining } from '../../../utils/format'
import UseItemDialog from './UseItemDialog.vue'

type Props = {
	kind: ResourceKind
	/** player to select initially */
	player?: string
}

const { kind, player } = defineProps<Props>()

const journalStore = useJournalStore()
const membersStore = useMembersStore()
const resourcesStore = useResourcesStore()
const sessionStore = useSessionStore()

const countHints = {
	items: 'предметов',
	perks: 'перков',
	effects: 'эффектов',
}

const emptyHints = {
	items: 'предметов',
	perks: 'перков',
	effects: 'активных эффектов',
}

const query = ref('')
const selected = ref(player ?? sessionStore.login)
const usingItem = ref<ItemStack>()

watch(
	() => player,
	() => {
		selected.value = player ?? sessionStore.login
	},
)

const isMine = computed(() => selected.value === sessionStore.login)
const resources = computed(() => resourcesStore.byPlayer[selected.value])

const players = computed(() => {
	const q = query.value.trim().toLowerCase()

	return membersStore.players
		.filter((p) => !q || p.login.includes(q))
		.map((p) => ({
			...p,
			label: p.login === sessionStore.login ? `${p.login} (ты)` : p.login,
			count: resourcesStore.summaries[kind]?.find((s) => s.login === p.login)?.count,
		}))
})

watch(
	[() => kind, () => journalStore.revision],
	() => resourcesStore.loadSummary(kind),
	{ immediate: true },
)

watch(
	[selected, () => journalStore.revision],
	() => resourcesStore.loadPlayer(selected.value),
	{ immediate: true },
)

const isEmpty = computed(
	() => !!resources.value && resources.value[kind].length === 0,
)

const emptyText = computed(
	() =>
		`${isMine.value ? 'У тебя' : `У ${selected.value}`} пока нет ${emptyHints[kind]}.`,
)

const hasUses = (left?: number, max?: number) => max != null && left != null
</script>

<template>
	<div class="layout">
		<div class="panel">
			<span class="label">Игроки</span>
			<UiInput v-model="query" placeholder="Найти игрока…" icon="search" />

			<div class="players">
				<div
					v-for="p in players"
					:key="p.login"
					class="player"
					:class="{ 'player--on': p.login === selected }"
					@click="selected = p.login"
				>
					<UiPlayerAvatar :name="p.login" :color="`var(--player-${p.colorIndex})`" :size="22" />
					<span class="player__name">{{ p.label }}</span>
					<span class="player__count">{{ p.count }}</span>
				</div>
			</div>

			<span class="panel__hint">Справа — число {{ countHints[kind] }}</span>
		</div>

		<div class="content">
			<div class="who">
				<UiPlayerAvatar :name="selected" :color="membersStore.colorOf(selected)" :size="36" />
				<span class="who__name">{{ selected }}</span>
				<UiBadge v-if="isMine" tone="accent">ты</UiBadge>
			</div>

			<div v-if="kind === 'items'" class="cards">
				<div v-for="item in resources?.items" :key="item.name" class="card">
					<div class="card__head">
						<span class="card__title">{{ item.name }}</span>
						<span class="card__held">×{{ item.held }}</span>
					</div>
					<span class="card__text">{{ item.description }}</span>
					<span class="card__meta">
						<span>Использований</span>
						<span class="card__meta-value">{{ item.usesLeft }} из {{ item.usesMax }}</span>
					</span>
					<UiButton
						v-if="isMine"
						class="card__use"
						variant="outline"
						size="sm"
						:disabled="item.held === 0 || item.usesLeft === 0"
						@click="usingItem = item"
					>
						Использовать
					</UiButton>
				</div>
			</div>

			<div v-else-if="kind === 'perks'" class="cards">
				<div v-for="perk in resources?.perks" :key="perk.name" class="card">
					<span class="card__title">{{ perk.name }}</span>

					<div class="effect">
						<div class="effect__head">
							<span class="effect__label">
								<UiIcon name="sparkles" :size="14" />
								Эффект
							</span>
							<UiBadge :tone="perk.kind === 'active' ? 'accent' : 'neutral'">
								{{ perk.kind === 'active' ? 'активный' : 'пассивный' }}
							</UiBadge>
						</div>
						<span class="effect__name">{{ perk.effect.name }}</span>
						<span class="effect__text">{{ perk.effect.text }}</span>
						<span v-if="perk.kind === 'active'" class="effect__uses">
							<span>Использований на неделе</span>
							<span class="card__meta-value">{{ perk.usesLeft }} из {{ perk.usesMax }}</span>
						</span>
					</div>

					<UiButton
						v-if="isMine && perk.kind === 'active'"
						class="card__use"
						variant="outline"
						size="sm"
						:disabled="!perk.usesLeft"
						@click="resourcesStore.usePerk(perk.name, perk.effect.name)"
					>
						Использовать
					</UiButton>
				</div>
			</div>

			<div v-else class="cards">
				<div v-for="effect in resources?.effects" :key="effect.name" class="card">
					<span class="card__title">{{ effect.name }}</span>
					<span class="card__desc">{{ effect.description }}</span>
					<span class="card__source">{{ effect.source }}</span>

					<div class="card__footer">
						<span v-if="effect.expiresAt" class="term">
							<UiIcon name="clock" :size="14" />
							осталось {{ formatRemaining(effect.expiresAt) }}
						</span>
						<span v-else-if="!hasUses(effect.usesLeft, effect.usesMax)" class="term">
							<UiIcon name="infinity" :size="14" />
							без срока
						</span>
						<span v-if="hasUses(effect.usesLeft, effect.usesMax)" class="card__meta">
							<span>Использований</span>
							<span class="card__meta-value">{{ effect.usesLeft }} из {{ effect.usesMax }}</span>
						</span>
					</div>
				</div>
			</div>

			<div v-if="isEmpty" class="empty">{{ emptyText }}</div>
		</div>
	</div>

	<UseItemDialog :item="usingItem" @close="usingItem = undefined" />
</template>

<style scoped>
.layout {
	display: grid;
	grid-template-columns: 240px minmax(0, 1fr);
	gap: 20px;
	align-items: start;
}

.panel {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
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

.players {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.player {
	display: flex;
	align-items: center;
	gap: 10px;
	height: 40px;
	padding: 0 10px;
	font: var(--type-body-sm);
	color: var(--text-strong);
	border-radius: var(--radius-sm);
	cursor: pointer;
}

.player:hover,
.player--on {
	background: var(--surface-sunken);
}

.player--on {
	font-weight: 600;
}

.player__name {
	flex: 1;
}

.player__count {
	font: 600 13px / 1 var(--font-mono);
	color: var(--text-muted);
}

.panel__hint {
	font: var(--type-caption);
	color: var(--text-subtle);
}

.content {
	display: flex;
	flex-direction: column;
	gap: 16px;
	min-width: 0;
}

.who {
	display: flex;
	align-items: center;
	gap: 12px;
}

.who__name {
	font: var(--type-h3);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
}

.cards {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: 16px;
}

.card {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 16px;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.card__head {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 8px;
}

.card__title {
	font: var(--type-h4);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
}

.card__held {
	font: 700 14px / 1 var(--font-mono);
	color: var(--text-strong);
}

.card__text {
	flex: 1;
	font: var(--type-body-sm);
	color: var(--text-muted);
	text-wrap: pretty;
}

.card__desc {
	font: var(--type-body-sm);
	color: var(--text-body);
	text-wrap: pretty;
}

.card__source {
	flex: 1;
	font: var(--type-caption);
	color: var(--text-muted);
}

.card__meta {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: 8px;
	font: var(--type-caption);
	color: var(--text-muted);
}

.card__text + .card__meta {
	padding-top: 8px;
	border-top: 1px solid var(--border-subtle);
}

.card__meta-value {
	font: var(--type-mono);
	color: var(--text-strong);
	white-space: nowrap;
}

.card .card__use {
	width: 100%;
}

.effect {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 6px;
	padding: 12px;
	background: var(--surface-sunken);
	border-radius: var(--radius-md);
}

.effect__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
}

.effect__label {
	display: flex;
	align-items: center;
	gap: 6px;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.effect__name {
	font: 600 15px / 1.4 var(--font-body);
	color: var(--text-strong);
}

.effect__text {
	font: var(--type-body-sm);
	color: var(--text-muted);
	text-wrap: pretty;
}

.effect__uses {
	display: flex;
	justify-content: space-between;
	gap: 8px;
	padding-top: 8px;
	font: var(--type-caption);
	color: var(--text-muted);
	border-top: 1px solid var(--border-default);
}

.card__footer {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding-top: 8px;
	border-top: 1px solid var(--border-subtle);
}

.term {
	display: flex;
	align-items: center;
	gap: 6px;
	font: 600 13px / 1.4 var(--font-body);
	color: var(--text-strong);
}

.empty {
	padding: 24px 16px;
	font: var(--type-body-sm);
	color: var(--text-muted);
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
}
</style>
