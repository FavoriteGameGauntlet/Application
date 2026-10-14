<script setup lang="ts">
import { ref, watch } from 'vue'
import UiButton from '../../../components/ui/UiButton.vue'
import UiInput from '../../../components/ui/UiInput.vue'
import { useToastStore } from '../../../stores/toastStore'
import { useWishlistStore } from '../../../stores/wishlistStore'
import { formatDate } from '../../../utils/format'

type Props = {
	player: string
}

const { player } = defineProps<Props>()

const toastStore = useToastStore()
const wishlistStore = useWishlistStore()

const query = ref('')

watch(
	() => player,
	() => {
		query.value = ''
		wishlistStore.load(player)
	},
	{ immediate: true },
)

const onAdd = async () => {
	const name = query.value.trim()

	if (!name) {
		toastStore.show(
			'Впиши название',
			'Напиши игру и нажми «Добавить».',
			'danger',
		)
		return
	}

	if (await wishlistStore.add(player, name)) {
		query.value = ''
	}
}
</script>

<template>
	<div class="add">
		<div class="add__input">
			<UiInput
				v-model="query"
				placeholder="Название игры"
				icon="gamepad-2"
				@keydown.enter="onAdd"
			/>
		</div>
		<UiButton class="add__button" variant="secondary" size="lg" icon="plus" @click="onAdd">
			Добавить
		</UiButton>
	</div>

	<div class="table">
		<div class="table__row table__row--head">
			<span>Игра в вишлисте {{ player }}</span>
			<span>Добавлена</span>
		</div>

		<div
			v-for="game in wishlistStore.lists[player]"
			:key="game.id"
			class="table__row table__row--body"
		>
			<span class="table__name">{{ game.name }}</span>
			<span class="table__date">{{ formatDate(game.addedAt) }}</span>
		</div>

		<div v-if="!wishlistStore.lists[player]?.length" class="table__empty">
			Вишлист {{ player }} пока пуст. Подкинь игру через поле выше.
		</div>
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

.table {
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.table__row {
	display: grid;
	grid-template-columns: minmax(0, 1fr) max-content;
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

.table__empty {
	padding: 24px 16px;
	font: var(--type-body-sm);
	color: var(--text-muted);
	border-top: 1px solid var(--border-subtle);
}
</style>
