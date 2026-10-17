<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Party } from '../../api-facade/contracts'
import AppLogo from '../../components/AppLogo.vue'
import TopbarControls from '../../components/TopbarControls.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import { RouteName } from '../../router/routeNames'
import { usePartiesStore } from '../../stores/partiesStore'
import { useToastStore } from '../../stores/toastStore'
import { formatDate, formatPeriod } from '../../utils/format'
import { plural } from '../../utils/plural'

const router = useRouter()
const partiesStore = usePartiesStore()
const toastStore = useToastStore()

const meta = (party: Party) => {
	const members = `${party.membersCount} ${plural(party.membersCount, ['участник', 'участника', 'участников'])}`

	if (party.status === 'active') return `${members} · до ${formatDate(party.endsAt)}`

	return `${members} · ${formatPeriod(party.startsAt, party.endsAt)}.${new Date(party.endsAt).getFullYear()}`
}

const items = computed(() =>
	partiesStore.list.map((party) => ({
		party,
		meta: meta(party),
		active: party.status === 'active',
	})),
)

const onOpen = async (party: Party, text: string) => {
	try {
		await partiesStore.select(party)
	} catch (e) {
		toastStore.error(e)
		return
	}

	await router.push({ name: RouteName.Home })

	if (!party.current) toastStore.show(`Пати: ${party.name}`, text, 'info')
}

onMounted(async () => {
	try {
		await partiesStore.load()
	} catch (e) {
		toastStore.error(e)
	}
})
</script>

<template>
	<div class="parties">
		<header class="topbar">
			<AppLogo :height="32" />
			<div class="topbar__spacer"></div>
			<TopbarControls />
		</header>

		<div class="scroll">
			<div class="content">
				<UiPageTitle>Мои пати</UiPageTitle>

				<div v-for="item in items" :key="item.party.id" class="card">
					<span
						class="card__accent"
						:class="{ 'card__accent--on': item.party.current }"
					></span>

					<span class="hex" :class="{ 'hex--on': item.party.current }">
						{{ item.party.name[0] }}
					</span>

					<div class="card__info">
						<span class="card__head">
							<span class="card__name">{{ item.party.name }}</span>
							<UiBadge :tone="item.active ? 'success' : 'neutral'">
								{{ item.active ? 'идёт' : 'завершён' }}
							</UiBadge>
							<UiBadge tone="navy">
								{{ item.party.role === 'admin' ? 'админ' : 'игрок' }}
							</UiBadge>
						</span>
						<span class="card__meta">{{ item.meta }}</span>
					</div>

					<UiButton
						:variant="item.party.current ? 'primary' : 'outline'"
						@click="onOpen(item.party, item.meta)"
					>
						Открыть
					</UiButton>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.parties {
	display: flex;
	flex-direction: column;
	height: 100%;
	min-width: 1100px;
	background: var(--surface-page);
}

.topbar {
	position: relative;
	z-index: 10;
	display: flex;
	flex: none;
	align-items: center;
	gap: 12px;
	height: var(--topbar-h);
	padding: 0 24px;
	background: var(--surface-card);
	border-bottom: 1px solid var(--border-subtle);
}

.topbar__spacer {
	flex: 1;
}

.scroll {
	flex: 1;
	min-height: 0;
	overflow: auto;
}

.content {
	display: flex;
	flex-direction: column;
	gap: 16px;
	box-sizing: border-box;
	max-width: 760px;
	padding: 48px 32px;
	margin: 0 auto;
}

.card {
	position: relative;
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 16px 20px;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.card__accent {
	position: absolute;
	top: 0;
	left: 20px;
	width: 40px;
	height: 4px;
	background: transparent;
	border-radius: 0 0 2px 2px;
}

.card__accent--on {
	background: var(--accent);
}

.hex {
	display: flex;
	flex: none;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 53px;
	font: 800 20px / 1 var(--font-display);
	color: var(--text-strong);
	background: var(--surface-sunken);
	clip-path: var(--hex-clip);
}

.hex--on {
	color: var(--text-on-accent);
	background: var(--accent);
}

.card__info {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
}

.card__head {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.card__name {
	font: var(--type-h4);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
}

.card__meta {
	font: var(--type-body-sm);
	color: var(--text-muted);
}
</style>
