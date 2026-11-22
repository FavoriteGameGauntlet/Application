<script setup lang="ts">
import { computed, ref } from 'vue'
import FormDialog from '../../components/FormDialog.vue'
import type { FormField, FormValues } from '../../components/formDialog'
import ListHead from '../../components/ListHead.vue'
import UiFilterSelect from '../../components/ui/UiFilterSelect.vue'
import UiTabs from '../../components/ui/UiTabs.vue'
import { useCompletedStore } from '../../stores/completedStore'
import { useMembersStore } from '../../stores/membersStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useWishlistStore } from '../../stores/wishlistStore'
import CompletedTab from './components/CompletedTab.vue'
import WishlistTab from './components/WishlistTab.vue'

const tabs = ['Список желаемого', 'Пройденные']

const membersStore = useMembersStore()
const sessionStore = useSessionStore()
const wishlistStore = useWishlistStore()
const completedStore = useCompletedStore()

const tab = ref(tabs[0])

/** the current user comes first, the list opens on their own games */
const users = computed(() => [
	{ value: sessionStore.login, label: sessionStore.login },
	...membersStore.users
		.filter((p) => p.login !== sessionStore.login)
		.map((p) => ({ value: p.login, label: p.login })),
])

/** whose lists the tabs show */
const user = ref(sessionStore.login)

const mine = computed(() => user.value === sessionStore.login)

const isWishlistTab = computed(() => tab.value === 'Список желаемого')

const count = computed(() =>
	isWishlistTab.value
		? (wishlistStore.lists[user.value]?.length ?? 0)
		: (completedStore.lists[user.value]?.length ?? 0),
)

const addInitial: FormValues = { name: '' }

const isAdding = ref(false)
const addError = ref<string>()
/** the name that the backend refused, so a new text takes the message away */
let refusedName = ''

const addOwner = computed(() => (mine.value ? '' : ` ${user.value}`))

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

		<component :is="isWishlistTab ? WishlistTab : CompletedTab" :user :mine>
			<div class="player">
				<UiFilterSelect v-model="user" label="Игрок" :options="users" />
			</div>
		</component>
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

.player {
	margin-left: auto;
}
</style>
