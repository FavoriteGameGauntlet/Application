<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type {
	RemovedWishlistEntry,
	WishlistEntry,
} from '../../../api-facade/contracts'
import UiBadge from '../../../components/ui/UiBadge.vue'
import UiButton from '../../../components/ui/UiButton.vue'
import UiIconButton from '../../../components/ui/UiIconButton.vue'
import UiInput from '../../../components/ui/UiInput.vue'
import UiRowMenu, {
	type RowMenuItem,
} from '../../../components/ui/UiRowMenu.vue'
import UiSwitch from '../../../components/ui/UiSwitch.vue'
import UiUserAvatar from '../../../components/ui/UiUserAvatar.vue'
import { useMembersStore } from '../../../stores/membersStore'
import { useSessionStore } from '../../../stores/sessionStore'
import { useToastStore } from '../../../stores/toastStore'
import { useWishlistStore } from '../../../stores/wishlistStore'
import { dayOf, formatShortDay } from '../../../utils/calendar'
import { plural } from '../../../utils/plural'

type Props = {
	/** whose wishlist is shown */
	user: string
	/** the current user's list: rename, delete and the removed games */
	mine?: boolean
}

const { user, mine } = defineProps<Props>()

const membersStore = useMembersStore()
const sessionStore = useSessionStore()
const toastStore = useToastStore()
const wishlistStore = useWishlistStore()

const newName = ref('')
const query = ref('')
const showRemoved = ref(false)

const editingId = ref<number>()
const editingName = ref('')

watch(
	() => user,
	() => {
		newName.value = ''
		query.value = ''
		wishlistStore.load(user)
	},
	{ immediate: true },
)

watch(showRemoved, async (shown) => {
	if (!shown) return

	try {
		await wishlistStore.loadRemoved()
	} catch (e) {
		toastStore.error(e)
	}
})

const games = computed(() => wishlistStore.lists[user] ?? [])

const countText = computed(
	() =>
		`${games.value.length} ${plural(games.value.length, ['игра', 'игры', 'игр'])}`,
)

const startEdit = (game: WishlistEntry) => {
	editingId.value = game.id
	editingName.value = game.name
}

const saveEdit = async () => {
	const id = editingId.value
	const name = editingName.value.trim()

	editingId.value = undefined

	if (id !== undefined && name) {
		await wishlistStore.rename(id, name)
	}
}

const onEditKeydown = (event: KeyboardEvent) => {
	if (event.key === 'Enter') saveEdit()
	if (event.key === 'Escape') editingId.value = undefined
}

const menuOf = (
	game: WishlistEntry,
	removalKind?: RemovedWishlistEntry['removalKind'],
): RowMenuItem[] => {
	if (!mine || removalKind === 'started') return []

	if (removalKind === 'removed') {
		return [
			{
				label: 'Вернуть',
				icon: 'rotate-ccw',
				select: () => wishlistStore.restore(game),
			},
		]
	}

	return [
		{ label: 'Переименовать', icon: 'pencil', select: () => startEdit(game) },
		{
			label: 'Удалить',
			icon: 'trash-2',
			danger: true,
			select: () => wishlistStore.remove(game),
		},
	]
}

const menuLabel = (removalKind?: RemovedWishlistEntry['removalKind']) => {
	if (!mine) return 'Менять можно только свой список желаемого'
	if (removalKind === 'started') return 'Начатую игру не вернуть'
	return 'Действия с игрой'
}

const rows = computed(() => {
	const q = query.value.trim().toLowerCase()
	const matches = (g: WishlistEntry) => !q || g.name.toLowerCase().includes(q)

	return [
		...games.value
			.filter(matches)
			.map((game) => ({ game, removalKind: undefined })),
		...(mine && showRemoved.value
			? wishlistStore.removed
					.filter(matches)
					.map((game) => ({ game, removalKind: game.removalKind }))
			: []),
	].map(({ game, removalKind }) => ({
		game,
		removalKind,
		menu: menuOf(game, removalKind),
		menuLabel: menuLabel(removalKind),
	}))
})

const emptyText = computed(() => {
	if (games.value.length) return 'Ничего не нашлось.'

	return mine
		? 'Список желаемого пуст. Впиши игру в поле сверху и нажми «Добавить игру».'
		: `Список желаемого у ${user} пока пуст. Подкинь игру через поле сверху.`
})

const onAdd = async () => {
	const name = newName.value.trim()

	if (!name) {
		toastStore.show(
			'Впиши название',
			'Напиши игру в поле сверху и нажми «Добавить игру».',
			'danger',
		)
		return
	}

	if (await wishlistStore.add(user, name)) {
		newName.value = ''
	}
}
</script>

<template>
	<div class="add">
		<div class="add__input">
			<UiInput
				v-model="newName"
				icon="search"
				:placeholder="
					mine
						? 'Название игры, чтобы добавить в список желаемого…'
						: `Название игры, чтобы подкинуть в список желаемого ${user}…`
				"
				aria-label="Новая игра"
				@keydown.enter="onAdd"
			/>
		</div>
		<UiButton
			class="add__button"
			variant="secondary"
			size="lg"
			icon="plus"
			@click="onAdd"
		>
			Добавить игру
		</UiButton>
	</div>

	<div class="bar">
		<span class="bar__label">В списке желаемого</span>
		<span class="bar__count">{{ countText }}</span>
		<div class="bar__end">
			<UiSwitch v-if="mine" v-model="showRemoved" label="Показать удалённые" />
			<div class="bar__search">
				<UiInput
					v-model="query"
					compact
					icon="search"
					placeholder="Найти в списке желаемого…"
					aria-label="Поиск по списку желаемого"
				/>
			</div>
		</div>
	</div>

	<div class="table" role="table" :aria-label="`Список желаемого ${user}`">
		<div class="row row--head" role="row">
			<span role="columnheader">Игра</span>
			<span role="columnheader">Добавлена</span>
			<span role="columnheader">Кто добавил</span>
		</div>

		<component
			:is="editingId === game.id ? 'div' : UiRowMenu"
			v-for="{ game, removalKind, menu, menuLabel: label } in rows"
			:key="game.id"
			class="row row--body"
			:class="{
				'row--editing': editingId === game.id,
				'row--dead': removalKind,
			}"
			role="row"
			v-bind="
				editingId === game.id
					? {}
					: { items: menu, label, disabled: !menu.length }
			"
		>
			<span v-if="editingId === game.id" class="edit" role="cell">
				<UiInput
					v-model="editingName"
					compact
					auto-focus
					aria-label="Название игры"
					@keydown="onEditKeydown"
				/>
				<UiIconButton
					icon="check"
					size="sm"
					label="Сохранить"
					@click="saveEdit"
				/>
				<UiIconButton
					icon="x"
					size="sm"
					label="Отмена"
					@click="editingId = undefined"
				/>
			</span>
			<span v-else class="name" role="cell">
				<span class="name__text">{{ game.name }}</span>
				<UiBadge v-if="removalKind">{{
					removalKind === 'removed' ? 'удалена' : 'начата'
				}}</UiBadge>
			</span>
			<span class="date" role="cell">{{
				formatShortDay(dayOf(game.addedDate))
			}}</span>
			<span class="author" role="cell">
				<template v-if="game.addedBy">
					<UiUserAvatar
						:name="game.addedBy"
						:color="membersStore.colorOf(game.addedBy)"
						:size="24"
					/>
					<span class="author__login">{{ game.addedBy }}</span>
					<UiBadge v-if="game.addedBy === sessionStore.login" tone="accent"
						>ты</UiBadge
					>
				</template>
				<span v-else class="none">—</span>
			</span>
		</component>

		<div v-if="!rows.length" class="empty">{{ emptyText }}</div>
	</div>
</template>

<style scoped>
.add {
	display: flex;
	align-items: flex-end;
	gap: 12px;
}

.add__input {
	flex: 1;
}

.add .add__button {
	height: 44px;
}

.bar {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
}

.bar__label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.bar__count {
	font: var(--type-caption);
	color: var(--text-muted);
}

.bar__end {
	display: flex;
	align-items: center;
	gap: 16px;
	margin-left: auto;
}

.bar__search {
	width: 260px;
}

.table {
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

/* the right 60px stay free for the «⋯» of the row */
.row {
	display: grid;
	grid-template-columns: minmax(0, 1.6fr) 130px minmax(0, 1fr);
	gap: 16px;
	align-items: center;
	box-sizing: border-box;
	padding: 12px 60px 12px 20px;
}

.row--head {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
	white-space: nowrap;
	background: var(--surface-sunken);
}

.row--body {
	min-height: 56px;
	border-top: 1px solid var(--border-subtle);
}

.row--body:hover,
.row--editing {
	background: var(--surface-sunken);
}

.row--dead .name__text,
.row--dead .date,
.row--dead .author {
	opacity: 0.5;
}

.name {
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
}

.name__text {
	overflow: hidden;
	font: 600 15px / 1.35 var(--font-body);
	color: var(--text-strong);
	text-overflow: ellipsis;
	white-space: nowrap;
}

.edit {
	display: flex;
	align-items: center;
	gap: 4px;
	min-width: 0;
}

.edit > :first-child {
	flex: 1;
	min-width: 0;
}

.date {
	color: var(--text-body);
}

.author {
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
}

.author__login {
	overflow: hidden;
	color: var(--text-body);
	text-overflow: ellipsis;
	white-space: nowrap;
}

.none {
	color: var(--text-muted);
}

.empty {
	padding: 20px;
	color: var(--text-muted);
	border-top: 1px solid var(--border-subtle);
}
</style>
