<script setup lang="ts">
import { computed, ref } from 'vue'
import CurrentGameCard from '../../components/CurrentGameCard.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import UiSelect from '../../components/ui/UiSelect.vue'
import UiTabs from '../../components/ui/UiTabs.vue'
import { useMembersStore } from '../../stores/membersStore'
import { useSessionStore } from '../../stores/sessionStore'
import CompletedTab from './components/CompletedTab.vue'
import WishlistTab from './components/WishlistTab.vue'

const tabs = [
	'Мой список желаемого',
	'Списки желаемого игроков',
	'Мои пройденные',
	'Пройденные игроков',
]

const membersStore = useMembersStore()
const sessionStore = useSessionStore()

const tab = ref(tabs[0])

const otherUsers = computed(() =>
	membersStore.users
		.filter((p) => p.login !== sessionStore.login)
		.map((p) => p.login),
)

const selectedUser = ref(otherUsers.value[0])

const isUserTab = computed(
	() =>
		tab.value === 'Списки желаемого игроков' ||
		tab.value === 'Пройденные игроков',
)
</script>

<template>
	<div class="games">
		<UiPageTitle>Игры</UiPageTitle>

		<CurrentGameCard />

		<div class="games__content">
			<UiTabs v-model="tab" :items="tabs" />

			<div v-if="isUserTab" class="user">
				<span class="user__label">Игрок</span>
				<div class="user__select">
					<UiSelect
						v-model="selectedUser"
						:options="otherUsers"
						aria-label="Игрок"
					/>
				</div>
			</div>

			<WishlistTab
				v-if="tab === 'Мой список желаемого'"
				key="mine"
				:user="sessionStore.login"
				mine
			/>
			<WishlistTab
				v-else-if="tab === 'Списки желаемого игроков'"
				key="others"
				:user="selectedUser"
			/>
			<CompletedTab
				v-else-if="tab === 'Мои пройденные'"
				:user="sessionStore.login"
				mine
			/>
			<CompletedTab v-else :user="selectedUser" />
		</div>
	</div>
</template>

<style scoped>
.games {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.games__content {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.user {
	display: flex;
	align-items: center;
	gap: 12px;
}

.user__label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.user__select {
	width: 240px;
}
</style>
