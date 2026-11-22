<script setup lang="ts">
import { computed, ref } from 'vue'
import FormDialog from '../../components/FormDialog.vue'
import type { FormField, FormValues } from '../../components/formDialog'
import ListHead from '../../components/ListHead.vue'
import UiFilterSelect from '../../components/ui/UiFilterSelect.vue'
import UiTabs from '../../components/ui/UiTabs.vue'
import { useMembersStore } from '../../stores/membersStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useWishlistStore } from '../../stores/wishlistStore'
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
const wishlistStore = useWishlistStore()

const tab = ref(tabs[0])

const otherUsers = computed(() =>
	membersStore.users
		.filter((p) => p.login !== sessionStore.login)
		.map((p) => ({ value: p.login, label: p.login })),
)

const selectedUser = ref(otherUsers.value[0]?.value ?? '')

const isUserTab = computed(
	() =>
		tab.value === 'Списки желаемого игроков' ||
		tab.value === 'Пройденные игроков',
)

const isWishlistTab = computed(
	() =>
		tab.value === 'Мой список желаемого' ||
		tab.value === 'Списки желаемого игроков',
)

/** whose list the tab shows */
const user = computed(() =>
	isUserTab.value ? selectedUser.value : sessionStore.login,
)

/** the completed games are counted by the state chips of their tab */
const count = computed(() =>
	isWishlistTab.value
		? (wishlistStore.lists[user.value]?.length ?? 0)
		: undefined,
)

const addInitial: FormValues = { name: '' }

const isAdding = ref(false)
const addError = ref<string>()
/** the name that the backend refused, so a new text takes the message away */
let refusedName = ''

const addOwner = computed(() =>
	user.value === sessionStore.login ? '' : ` ${user.value}`,
)

const addFields = computed<FormField[]>(() => [
	{
		key: 'name',
		label: 'Название',
		placeholder: 'Название игры',
		required: 'название',
		error: addError.value,
	},
])

const openAdd = () => {
	addError.value = undefined
	isAdding.value = true
}

const onAddChange = (values: FormValues) => {
	if (String(values.name).trim() !== refusedName) addError.value = undefined
}

const onAdd = async (values: FormValues) => {
	const name = String(values.name).trim()
	const result = await wishlistStore.add(user.value, name)

	refusedName = name

	if (result === 'added') {
		isAdding.value = false
	} else if (result === 'exists') {
		addError.value = `${name} уже в списке желаемого${addOwner.value}.`
	} else if (result === 'picked') {
		addError.value = `${name} уже выбирали${addOwner.value ? ` у${addOwner.value}` : ''}.`
	}
}
</script>

<template>
	<div class="games">
		<ListHead title="Игры" :count :no-add="!isWishlistTab" @add="openAdd" />

		<UiTabs v-model="tab" :items="tabs" />

		<WishlistTab
			v-if="isWishlistTab"
			:key="isUserTab ? 'others' : 'mine'"
			:user
			:mine="!isUserTab"
		>
			<UiFilterSelect
				v-if="isUserTab"
				v-model="selectedUser"
				label="Игрок"
				:options="otherUsers"
			/>
		</WishlistTab>
		<CompletedTab
			v-else
			:key="isUserTab ? 'others' : 'mine'"
			:user
			:mine="!isUserTab"
		>
			<UiFilterSelect
				v-if="isUserTab"
				v-model="selectedUser"
				label="Игрок"
				:options="otherUsers"
			/>
		</CompletedTab>
	</div>

	<FormDialog
		:open="isAdding"
		title="Добавить игру"
		:subtitle="addOwner ? `В список желаемого${addOwner}` : undefined"
		:sections="[{ fields: addFields }]"
		:initial="addInitial"
		submit-label="Добавить"
		@close="isAdding = false"
		@change="onAddChange"
		@save="onAdd"
	/>
</template>

<style scoped>
.games {
	display: flex;
	flex-direction: column;
	gap: 16px;
}
</style>
