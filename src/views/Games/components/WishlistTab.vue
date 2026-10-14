<script setup lang="ts">
import { computed, ref } from 'vue'
import type { WishlistGame } from '../../../api-facade/contracts'
import UiButton from '../../../components/ui/UiButton.vue'
import UiDialog from '../../../components/ui/UiDialog.vue'
import UiIconButton from '../../../components/ui/UiIconButton.vue'
import UiInput from '../../../components/ui/UiInput.vue'
import { useSessionStore } from '../../../stores/sessionStore'
import { useToastStore } from '../../../stores/toastStore'
import { useWishlistStore } from '../../../stores/wishlistStore'
import { formatDate } from '../../../utils/format'

const sessionStore = useSessionStore()
const toastStore = useToastStore()
const wishlistStore = useWishlistStore()

const query = ref('')

const editingId = ref<number>()
const editingName = ref('')

const deleting = ref<WishlistGame>()

const rows = computed(() => {
	const q = query.value.trim().toLowerCase()

	return wishlistStore.mine.filter((g) => !q || g.name.toLowerCase().includes(q))
})

const emptyText = computed(() =>
	wishlistStore.mine.length
		? 'Такой игры в вишлисте нет. Нажми «Добавить игру», чтобы добавить её.'
		: 'Вишлист пуст. Впиши игру и нажми «Добавить игру».',
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

const startEdit = (game: WishlistGame) => {
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

const confirmDelete = async () => {
	const game = deleting.value

	deleting.value = undefined

	if (game) {
		await wishlistStore.remove(game.id, game.name)
	}
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
		<UiButton class="add__button" variant="secondary" size="lg" icon="plus" @click="onAdd">
			Добавить игру
		</UiButton>
	</div>

	<div class="table">
		<div class="table__row table__row--head">
			<span>Игра</span>
			<span>Добавлена</span>
			<span></span>
		</div>

		<div v-for="game in rows" :key="game.id" class="table__row table__row--body">
			<template v-if="editingId === game.id">
				<UiInput
					v-model="editingName"
					auto-focus
					@keydown="onEditKeydown"
				/>
			</template>
			<span v-else class="table__name">{{ game.name }}</span>

			<span class="table__date">{{ formatDate(game.addedAt) }}</span>

			<span class="table__actions">
				<template v-if="editingId === game.id">
					<UiIconButton icon="check" size="sm" label="Сохранить" @click="saveEdit" />
					<UiIconButton icon="x" size="sm" label="Отмена" @click="editingId = undefined" />
				</template>
				<template v-else>
					<UiIconButton icon="pencil" size="sm" label="Переименовать" @click="startEdit(game)" />
					<UiIconButton
						class="table__delete"
						icon="trash-2"
						size="sm"
						label="Удалить"
						@click="deleting = game"
					/>
				</template>
			</span>
		</div>

		<div v-if="!rows.length" class="table__empty">{{ emptyText }}</div>
	</div>

	<UiDialog :open="!!deleting" title="Удалить игру?" :width="420" @close="deleting = undefined">
		<div class="dialog">
			<span>«{{ deleting?.name }}» пропадёт из твоего вишлиста и с колеса.</span>
			<div class="dialog__actions">
				<UiButton variant="outline" @click="deleting = undefined">Оставить</UiButton>
				<UiButton variant="danger" icon="trash-2" @click="confirmDelete">Удалить</UiButton>
			</div>
		</div>
	</UiDialog>
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

.dialog {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.dialog__actions {
	display: flex;
	gap: 8px;
	justify-content: flex-end;
}
</style>
