<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type {
	ItemUse,
	Perk,
	ResourceKind,
	UserItem,
} from '../../../api-facade/contracts'
import JournalSourceLabel from '../../../components/JournalSourceLabel.vue'
import UiBadge from '../../../components/ui/UiBadge.vue'
import UiButton from '../../../components/ui/UiButton.vue'
import UiIcon from '../../../components/ui/UiIcon.vue'
import UiInput from '../../../components/ui/UiInput.vue'
import UiUserAvatar from '../../../components/ui/UiUserAvatar.vue'
import { useJournalStore } from '../../../stores/journalStore'
import { useMembersStore } from '../../../stores/membersStore'
import { useResourcesStore } from '../../../stores/resourcesStore'
import { useSessionStore } from '../../../stores/sessionStore'
import { formatRemaining } from '../../../utils/format'
import { needsUseForm } from '../../../utils/itemUse'
import UseDialog, { type UseSubject } from './UseDialog.vue'

type Props = {
	kind: ResourceKind
	/** user to select initially */
	user?: string
}

const { kind, user } = defineProps<Props>()

const journalStore = useJournalStore()
const membersStore = useMembersStore()
const resourcesStore = useResourcesStore()
const sessionStore = useSessionStore()

const emptyHints = {
	items: 'предметов',
	perks: 'перков',
	effects: 'активных эффектов',
}

const query = ref('')
const selected = ref(user ?? sessionStore.login)
/** what the open dialog uses and what happens when it is confirmed */
const using = ref<{
	subject: UseSubject
	run: (use: ItemUse) => Promise<void>
}>()

const openItem = (item: UserItem) => {
	using.value = {
		subject: {
			title: `Использовать «${item.name}»`,
			text: item.description,
			entries: item.entries ?? [],
			shouldApplyToAll: item.shouldApplyToAll,
			conditions: item.conditions ?? [],
			excludeCopyId: item.id,
		},
		run: (use) => resourcesStore.useItem(item, use),
	}
}

/** a perk with targets or copies to pick asks first, any other is used at once */
const usePerk = (perk: Perk) => {
	if (
		!needsUseForm(
			perk.abilityEntries,
			sessionStore.login,
			perk.abilityShouldApplyToAll,
		)
	) {
		return resourcesStore.usePerk(perk.id, perk.name)
	}

	using.value = {
		subject: {
			title: `Использовать «${perk.name}»`,
			text: perk.description,
			entries: perk.abilityEntries ?? [],
			shouldApplyToAll: perk.abilityShouldApplyToAll ?? true,
			conditions: [],
		},
		run: (use) => resourcesStore.usePerk(perk.id, perk.name, use),
	}
}

const onConfirmUse = async (use: ItemUse) => {
	const current = using.value

	using.value = undefined

	await current?.run(use)
}

watch(
	() => user,
	() => {
		selected.value = user ?? sessionStore.login
	},
)

const isMine = computed(() => selected.value === sessionStore.login)
const resources = computed(() => resourcesStore.byUser[selected.value])

const users = computed(() => {
	const q = query.value.trim().toLowerCase()

	return membersStore.users
		.filter((p) => !q || p.login.includes(q))
		.map((p) => ({
			...p,
			label: p.login === sessionStore.login ? `${p.login} (ты)` : p.login,
			count: resourcesStore.summaries[kind]?.find((s) => s.login === p.login)
				?.count,
		}))
})

watch(
	[() => kind, () => journalStore.revision],
	() => resourcesStore.loadSummary(kind),
	{ immediate: true },
)

watch(
	[selected, () => journalStore.revision],
	() => resourcesStore.loadUser(selected.value),
	{ immediate: true },
)

const isEmpty = computed(
	() => !!resources.value && resources.value[kind].length === 0,
)

const emptyText = computed(
	() =>
		`${isMine.value ? 'У тебя' : `У ${selected.value}`} пока нет ${emptyHints[kind]}.`,
)
</script>

<template>
	<div class="layout">
		<div class="panel">
			<span class="label">Игроки</span>
			<UiInput v-model="query" placeholder="Найти игрока…" icon="search" />

			<div class="users">
				<div
					v-for="p in users"
					:key="p.login"
					class="user"
					:class="{ 'user--on': p.login === selected }"
					@click="selected = p.login"
				>
					<UiUserAvatar :name="p.login" :color="p.color" :size="22" />
					<span class="user__name">{{ p.label }}</span>
					<span class="user__count">{{ p.count }}</span>
				</div>
			</div>
		</div>

		<div class="content">
			<div class="who">
				<UiUserAvatar
					:name="selected"
					:color="membersStore.colorOf(selected)"
					:size="36"
				/>
				<span class="who__name">{{ selected }}</span>
				<UiBadge v-if="isMine" tone="accent">ты</UiBadge>
			</div>

			<div v-if="kind === 'items'" class="cards">
				<div v-for="item in resources?.items" :key="item.id" class="card">
					<div class="card__head">
						<span class="card__title" :title="item.name">{{ item.name }}</span>
					</div>
					<span class="card__text">{{ item.description }}</span>
					<span class="card__meta">
						<span>Использований</span>
						<span class="card__meta-value"
							>{{ item.usesLeft }} из {{ item.usesMax }}</span
						>
					</span>
					<UiButton
						v-if="isMine"
						class="card__use"
						variant="outline"
						size="sm"
						:disabled="item.usesLeft === 0"
						@click="openItem(item)"
					>
						Использовать
					</UiButton>
				</div>
			</div>

			<div v-else-if="kind === 'perks'" class="cards">
				<div v-for="perk in resources?.perks" :key="perk.id" class="card">
					<span class="card__title" :title="perk.name">{{ perk.name }}</span>

					<div class="effect">
						<div class="effect__head">
							<span class="effect__label">
								<UiIcon name="sparkles" :size="14" />
								Что даёт
							</span>
							<UiBadge :tone="perk.kind === 'active' ? 'accent' : 'neutral'">
								{{ perk.kind === 'active' ? 'активный' : 'пассивный' }}
							</UiBadge>
						</div>
						<span class="effect__text">{{ perk.description }}</span>
						<span
							v-for="modifier in perk.modifiers"
							:key="modifier"
							class="effect__text"
						>
							{{ modifier }}
						</span>
						<span v-if="perk.kind === 'active'" class="effect__uses">
							<span>Использований</span>
							<span class="card__meta-value"
								>{{ perk.usesLeft }} из {{ perk.usesMax }}</span
							>
						</span>
					</div>

					<UiButton
						v-if="isMine && perk.kind === 'active'"
						class="card__use"
						variant="outline"
						size="sm"
						:disabled="!perk.usesLeft"
						@click="usePerk(perk)"
					>
						Использовать
					</UiButton>
				</div>
			</div>

			<div v-else class="cards">
				<div v-for="effect in resources?.effects" :key="effect.id" class="card">
					<span class="card__title" :title="effect.name">{{
						effect.name
					}}</span>
					<span class="card__desc">{{ effect.description }}</span>
					<JournalSourceLabel class="card__source" :source="effect.source" />

					<div class="card__footer">
						<span v-if="effect.expiresAt" class="term">
							<UiIcon name="clock" :size="14" />
							осталось {{ formatRemaining(effect.expiresAt) }}
						</span>
						<span v-else class="term">
							<UiIcon name="infinity" :size="14" />
							без срока
						</span>
					</div>
				</div>
			</div>

			<div v-if="isEmpty" class="empty">{{ emptyText }}</div>
		</div>
	</div>

	<UseDialog
		:subject="using?.subject"
		@close="using = undefined"
		@confirm="onConfirmUse"
	/>
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

.users {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.user {
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

.user:hover,
.user--on {
	background: var(--surface-sunken);
}

.user--on {
	font-weight: 600;
}

.user__name {
	flex: 1;
}

.user__count {
	font: 600 13px / 1 var(--font-mono);
	color: var(--text-muted);
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
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font: var(--type-h4);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
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
