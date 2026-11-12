<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { WishlistEntry } from '../../../api-facade/contracts'
import UiBadge from '../../../components/ui/UiBadge.vue'
import UiButton from '../../../components/ui/UiButton.vue'
import UiIconButton from '../../../components/ui/UiIconButton.vue'
import UiInput from '../../../components/ui/UiInput.vue'
import UiSwitch from '../../../components/ui/UiSwitch.vue'
import { useSessionStore } from '../../../stores/sessionStore'
import { useToastStore } from '../../../stores/toastStore'
import { useWishlistStore } from '../../../stores/wishlistStore'
import { formatDate } from '../../../utils/format'

const sessionStore = useSessionStore()
const toastStore = useToastStore()
const wishlistStore = useWishlistStore()

const query = ref('')

const showRemoved = ref(false)

const editingId = ref<number>()
const editingName = ref('')

watch(showRemoved, async (shown) => {
	if (!shown) return

	try {
		await wishlistStore.loadRemoved()
	} catch (e) {
		toastStore.error(e)
	}
})

const rows = computed(() => {
	const q = query.value.trim().toLowerCase()
	const matches = (g: WishlistEntry) => !q || g.name.toLowerCase().includes(q)

	return [
		...wishlistStore.mine
			.filter(matches)
			.map((game) => ({ game, removalKind: undefined })),
		...(showRemoved.value
			? wishlistStore.removed
					.filter(matches)
					.map((game) => ({ game, removalKind: game.removalKind }))
			: []),
	]
})

const emptyText = computed(() =>
	wishlistStore.mine.length
		? 'Такой игры в списке желаемого нет. Нажми «Добавить игру», чтобы добавить её.'
		: 'Список желаемого пуст. Впиши игру и нажми «Добавить игру».',
)

const onAdd = async () => {
	const name = query.value.trim()

	if (!name) {
		toastStore.show(
			'Впиши название',
			'Напиши игру в поле поиска и нажми «Добавить».',
			'danger',
		)
		return
	}

	if (await wishlistStore.add(sessionStore.login, name)) {
		query.value = ''
	}
}

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
</script>

<template>
	<div class="add">
		<div class="add__input">
			<UiInput
				v-model="query"
				placeholder="Название игры…"
				icon="search"
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
		<div class="add__switch">
			<UiSwitch v-model="showRemoved" label="Показать удалённые" />
		</div>
	</div>

	<div class="table">
		<div class="table__row table__row--head">
			<span>Игра</span>
			<span>Добавлена</span>
			<span></span>
		</div>

		<div
			v-for="{ game, removalKind } in rows"
			:key="game.id"
			class="table__row table__row--body"
		>
			<template v-if="editingId === game.id">
				<UiInput v-model="editingName" auto-focus @keydown="onEditKeydown" />
			</template>
			<span v-else class="table__name">
				<span :class="{ 'cell--dead': removalKind }">{{ game.name }}</span>
				<UiBadge v-if="removalKind">{{
					removalKind === 'removed' ? 'удалена' : 'начата'
				}}</UiBadge>
			</span>

			<span class="table__date" :class="{ 'cell--dead': removalKind }">{{
				formatDate(game.addedDate)
			}}</span>

			<span class="table__actions">
				<UiIconButton
					v-if="removalKind === 'removed'"
					icon="rotate-ccw"
					size="sm"
					label="Вернуть"
					@click="wishlistStore.restore(game)"
				/>
				<template v-else-if="!removalKind">
					<template v-if="editingId === game.id">
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
					</template>
					<template v-else>
						<UiIconButton
							icon="pencil"
							size="sm"
							label="Переименовать"
							@click="startEdit(game)"
						/>
						<UiIconButton
							class="table__delete"
							icon="trash-2"
							size="sm"
							label="Удалить"
							@click="wishlistStore.remove(game)"
						/>
					</template>
				</template>
			</span>
		</div>

		<div v-if="!rows.length" class="table__empty">{{ emptyText }}</div>
	</div>
</template>

<style scoped>
.add {
	display: flex;
	align-items: flex-end;
	gap: 8px;
}

.add__input {
	flex: 1;
}

.add .add__button {
	height: 44px;
}

.add__switch {
	display: flex;
	align-items: center;
	height: 44px;
}

.cell--dead {
	opacity: 0.5;
}

.table {
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.table__row {
	display: grid;
	grid-template-columns: minmax(0, 1fr) max-content 72px;
	gap: 16px;
	align-items: center;
}

.table__row--head {
	padding: 12px 16px;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
	background: var(--surface-sunken);
}

.table__row--body {
	min-height: 44px;
	padding: 4px 16px;
	border-top: 1px solid var(--border-subtle);
}

.table__row--body:hover {
	background: var(--surface-sunken);
}

.table__name {
	display: flex;
	gap: 8px;
	align-items: center;
	font: 600 15px / 1.45 var(--font-body);
	color: var(--text-strong);
}

.table__date {
	font: var(--type-mono);
	color: var(--text-muted);
}

.table__actions {
	display: flex;
	gap: 4px;
	justify-content: flex-end;
}

.table .table__delete {
	color: var(--danger-text);
}

.table__empty {
	padding: 24px 16px;
	font: var(--type-body-sm);
	color: var(--text-muted);
	border-top: 1px solid var(--border-subtle);
}
</style>
