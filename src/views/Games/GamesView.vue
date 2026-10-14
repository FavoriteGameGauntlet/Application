<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import CurrentGameCard from '../../components/CurrentGameCard.vue'
import UiSelect from '../../components/ui/UiSelect.vue'
import UiTabs from '../../components/ui/UiTabs.vue'
import { useMembersStore } from '../../stores/membersStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useWishlistStore } from '../../stores/wishlistStore'
import CompletedTab from './components/CompletedTab.vue'
import PlayerWishlistTab from './components/PlayerWishlistTab.vue'
import WishlistTab from './components/WishlistTab.vue'

const tabs = [
	'Мой вишлист',
	'Вишлисты игроков',
	'Мои пройденные',
	'Пройденные игроков',
]

const membersStore = useMembersStore()
const sessionStore = useSessionStore()
const wishlistStore = useWishlistStore()

const tab = ref(tabs[0])

const otherPlayers = computed(() =>
	membersStore.players
		.filter((p) => p.login !== sessionStore.login)
		.map((p) => p.login),
)

const selectedPlayer = ref(otherPlayers.value[0])

const isPlayerTab = computed(
	() => tab.value === 'Вишлисты игроков' || tab.value === 'Пройденные игроков',
)

onMounted(() => wishlistStore.loadMine())
</script>

<template>
	<div class="games">
		<span class="games__title">Игры</span>

		<CurrentGameCard />

		<div class="games__content">
			<UiTabs v-model="tab" :items="tabs" />

			<div v-if="isPlayerTab" class="player">
				<span class="player__label">Игрок</span>
				<div class="player__select">
					<UiSelect v-model="selectedPlayer" :options="otherPlayers" aria-label="Игрок" />
				</div>
			</div>

			<WishlistTab v-if="tab === 'Мой вишлист'" />
			<PlayerWishlistTab v-else-if="tab === 'Вишлисты игроков'" :player="selectedPlayer" />
			<CompletedTab v-else-if="tab === 'Мои пройденные'" :player="sessionStore.login" mine />
			<CompletedTab v-else :player="selectedPlayer" />
		</div>
	</div>
</template>

<style scoped>
.games {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.games__title {
	font: var(--type-h2);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
}

.games__content {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.player {
	display: flex;
	align-items: center;
	gap: 12px;
}

.player__label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.player__select {
	width: 240px;
}
</style>
