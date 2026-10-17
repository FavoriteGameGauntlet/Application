<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CatalogEntry, CatalogEntryInput, CatalogKind } from '../../api-facade/contracts'
import type { FormField, FormValues } from '../../components/formDialog'
import FormDialog from '../../components/FormDialog.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiIcon from '../../components/ui/UiIcon.vue'
import UiIconButton from '../../components/ui/UiIconButton.vue'
import UiTag from '../../components/ui/UiTag.vue'
import { useAdminCatalogStore } from '../../stores/adminCatalogStore'
import { useToastStore } from '../../stores/toastStore'
import { formatSpan, parseSpan } from '../../utils/format'
import AdminListHeader from './components/AdminListHeader.vue'

type Props = {
	kind: CatalogKind
}

const { kind } = defineProps<Props>()

const store = useAdminCatalogStore()
const toastStore = useToastStore()

const configs: Record<
	CatalogKind,
	{ title: string; head2: string; head3: string; add: string }
> = {
	'point-types': {
		title: 'Типы очков',
		head2: 'Единица в журнале',
		head3: 'Всего у игроков',
		add: 'Новый тип очков',
	},
	items: { title: 'Предметы', head2: 'Изменение', head3: 'У игроков', add: 'Новый предмет' },
	effects: {
		title: 'Эффекты',
		head2: 'Изменение',
		head3: 'Длительность',
		add: 'Новый эффект',
	},
	perks: { title: 'Перки', head2: 'Эффект', head3: 'Тип', add: 'Новый перк' },
}

const config = computed(() => configs[kind])

const openId = ref<number>()
/** the entry that the dialog edits; `{}` is a new one, undefined means the dialog is closed */
const editing = ref<{ entry?: CatalogEntry }>()

const third = (entry: CatalogEntry) => {
	if (kind === 'effects') return entry.duration ? formatSpan(entry.duration) : '—'
	if (kind === 'perks') return entry.perkKind === 'active' ? 'активный' : 'пассивный'

	return String(entry.holdersTotal ?? 0)
}

const query = ref('')

const found = computed(() => {
	const q = query.value.trim().toLowerCase()

	return store.entries.filter(
		(e) =>
			!q ||
			[e.name, e.description, ...(e.changes ?? [])].some((s) => s.toLowerCase().includes(q)),
	)
})

const rows = computed(() =>
	found.value.map((entry) => ({
		entry,
		open: openId.value === entry.id,
		tags: entry.changes ?? [],
		unit: entry.unitForms?.join(' / ') ?? '—',
		third: third(entry),
		uses: entry.usesMax ?? '—',
	})),
)

const fields = computed<FormField[]>(() => {
	const common: FormField[] = [
		{
			key: 'name',
			label: 'Название',
			placeholder: { 'point-types': 'Золото', items: 'Свиток удачи', effects: 'Щит', perks: 'Везунчик' }[kind],
		},
		{
			key: 'description',
			label: 'Описание',
			type: 'area',
			placeholder: 'Что это и зачем — так увидят игроки',
			hint: 'Показывается игрокам в подсказках и в ресурсах.',
		},
	]

	switch (kind) {
		case 'point-types':
			return [
				...common,
				{
					key: 'unit1',
					label: 'Единица в журнале · 1',
					placeholder: 'билет',
					hint: 'Как пишется в журнале: 1 билет, 2 билета, 5 билетов.',
				},
				{ key: 'unit2', label: 'Единица в журнале · 2–4', placeholder: 'билета' },
				{ key: 'unit5', label: 'Единица в журнале · 5 и больше', placeholder: 'билетов' },
				{
					key: 'startValue',
					label: 'Стартовое значение',
					placeholder: '0',
					hint: 'С чем начинает каждый игрок (или вся пати для общих очков).',
				},
				{
					key: 'minimum',
					label: 'Минимум',
					placeholder: '0',
					hint: 'Пусто — без нижней границы.',
				},
				{
					key: 'maximum',
					label: 'Максимум',
					placeholder: '100',
					hint: 'Пусто — без верхней границы.',
				},
				{
					key: 'isPublic',
					type: 'check',
					label: 'Видят все игроки',
					hint: 'Выключено: тип и его значения видят только админы пати.',
				},
				...(editing.value?.entry
					? []
					: [
							{
								key: 'isShared',
								type: 'check' as const,
								label: 'Общие очки пати',
								hint: 'Одно значение на всю пати, меняется ручной формой. Потом это не изменить.',
							},
						]),
			]
		case 'items':
			return [
				...common,
				{
					key: 'changes',
					label: 'Изменение',
					type: 'tags',
					placeholder: '+50 Золото',
					hint: 'Впиши изменение и нажми Enter.',
				},
				{
					key: 'usesMax',
					label: 'Использований',
					placeholder: '1',
					hint: 'Сколько раз можно использовать одну копию предмета.',
				},
			]
		case 'effects':
			return [
				...common,
				{
					key: 'changes',
					label: 'Изменение',
					type: 'tags',
					placeholder: 'Золото за таймер ×2',
					hint: 'Впиши изменение и нажми Enter.',
				},
				{
					key: 'duration',
					label: 'Длительность',
					placeholder: '1 день',
					hint: 'Пусто — без срока.',
				},
				{
					key: 'usesMax',
					label: 'Использований',
					placeholder: '3',
					hint: 'Пусто — без ограничения, пока действует.',
				},
			]
		default:
			return [
				...common,
				{
					key: 'changes',
					label: 'Эффект',
					type: 'tags',
					placeholder: 'Бесплатный перекрут',
					hint: 'Впиши изменение и нажми Enter.',
				},
				{
					key: 'perkKind',
					label: 'Тип',
					type: 'select',
					options: [
						{ value: 'active', label: 'активный' },
						{ value: 'passive', label: 'пассивный' },
					],
				},
			]
	}
})

const initial = computed<FormValues>(() => {
	const entry = editing.value?.entry

	return {
		name: entry?.name ?? '',
		description: entry?.description ?? '',
		unit1: entry?.unitForms?.[0] ?? '',
		unit2: entry?.unitForms?.[1] ?? '',
		unit5: entry?.unitForms?.[2] ?? '',
		changes: entry?.changes ?? [],
		duration: entry?.duration ? formatSpan(entry.duration) : '',
		usesMax: entry?.usesMax != null ? String(entry.usesMax) : '',
		perkKind: entry?.perkKind ?? 'active',
		startValue: entry?.startValue != null ? String(entry.startValue) : '',
		minimum: entry?.minimum != null ? String(entry.minimum) : '',
		maximum: entry?.maximum != null ? String(entry.maximum) : '',
		isPublic: entry?.isPublic ?? true,
		isShared: false,
	}
})

const dialogTitle = computed(() => {
	const entry = editing.value?.entry

	return entry ? `Изменить «${entry.name}»` : config.value.add
})

const invalid = (title: string, text: string) => {
	toastStore.show(title, text, 'danger')
}

const onSave = async (values: FormValues) => {
	const text = (key: string) => String(values[key] ?? '').trim()
	const changes = (values.changes as string[] | undefined) ?? []
	const name = text('name')
	const description = text('description')

	if (!name) return invalid('Впиши название', 'Без него не сохранится.')

	if (kind === 'point-types' && !(text('unit1') && text('unit2') && text('unit5'))) {
		return invalid('Впиши единицы', 'Нужны все три формы: 1, 2–4 и 5 и больше.')
	}

	if (kind !== 'point-types' && !changes.length) {
		return invalid('Добавь изменение', 'Хотя бы одно: что произойдёт при использовании.')
	}

	if (!description) return invalid('Добавь описание', 'Игроки увидят его в подсказках.')

	const input: CatalogEntryInput = { name, description }

	if (kind === 'point-types') {
		const startValue = text('startValue') ? Number(text('startValue')) : 0
		const minimum = text('minimum') ? Number(text('minimum')) : null
		const maximum = text('maximum') ? Number(text('maximum')) : null

		if (![startValue, minimum, maximum].every((n) => n === null || Number.isInteger(n))) {
			return invalid('Не понял число', 'Стартовое значение и границы — целые числа.')
		}

		if (minimum !== null && maximum !== null && minimum > maximum) {
			return invalid('Границы перепутаны', 'Минимум не может быть больше максимума.')
		}

		if (
			(minimum !== null && startValue < minimum) ||
			(maximum !== null && startValue > maximum)
		) {
			return invalid('Старт вне границ', 'Стартовое значение должно быть между минимумом и максимумом.')
		}

		input.unitForms = [text('unit1'), text('unit2'), text('unit5')]
		input.startValue = startValue
		input.minimum = minimum
		input.maximum = maximum
		input.isPublic = values.isPublic === true

		if (!editing.value?.entry) input.isShared = values.isShared === true
	} else {
		input.changes = changes
	}

	if (kind === 'items') {
		const usesMax = Number(text('usesMax'))

		if (!(Number.isInteger(usesMax) && usesMax > 0)) {
			return invalid('Не понял число использований', 'Нужно целое число больше нуля.')
		}

		input.usesMax = usesMax
	}

	if (kind === 'effects') {
		const duration = text('duration')
		const usesMax = text('usesMax')

		input.duration = duration ? (parseSpan(duration) ?? NaN) : null
		input.usesMax = usesMax ? Number(usesMax) : null

		if (Number.isNaN(input.duration)) {
			return invalid('Не понял длительность', 'Напиши, например, «2 ч» или «1 день».')
		}

		if (input.usesMax !== null && !(Number.isInteger(input.usesMax) && input.usesMax > 0)) {
			return invalid('Не понял число использований', 'Нужно целое число больше нуля.')
		}
	}

	if (kind === 'perks') input.perkKind = text('perkKind') === 'passive' ? 'passive' : 'active'

	if (await store.saveEntry(kind, editing.value?.entry?.id, input)) {
		editing.value = undefined
	}
}

store.showDeleted = false

watch(
	() => kind,
	() => {
		openId.value = undefined
		editing.value = undefined
		query.value = ''
		store.showDeleted = false
	},
)

watch(
	[() => kind, () => store.showDeleted],
	() => store.loadCatalog(kind),
	{ immediate: true },
)
</script>

<template>
	<div class="catalog">
		<AdminListHeader
			v-model:show-deleted="store.showDeleted"
			v-model:query="query"
			:title="config.title"
			@add="editing = {}"
		/>

		<div class="table">
			<div class="table__row table__row--head" :class="{ 'table__row--fx': kind === 'effects' }">
				<span class="table__name-head">Название</span>
				<span>{{ config.head2 }}</span>
				<span>{{ config.head3 }}</span>
				<span v-if="kind === 'effects'">Использований</span>
				<span></span>
			</div>

			<div v-for="row in rows" :key="row.entry.id" class="item" :class="{ 'item--open': row.open }">
				<div
					class="table__row table__row--body"
					:class="{ 'table__row--fx': kind === 'effects' }"
					@click="openId = row.open ? undefined : row.entry.id"
				>
					<div class="cell cell--name" :class="{ 'cell--dead': row.entry.deleted }">
						<span class="cell__chevron">
							<UiIcon :name="row.open ? 'chevron-down' : 'chevron-right'" :size="16" />
						</span>
						<span class="cell__title">{{ row.entry.name }}</span>
						<UiBadge v-if="row.entry.deleted">удалён</UiBadge>
					</div>

					<div class="cell cell--tags" :class="{ 'cell--dead': row.entry.deleted }">
						<span v-if="kind === 'point-types'" class="cell__text">{{ row.unit }}</span>
						<template v-else>
							<UiTag v-for="tag in row.tags" :key="tag">{{ tag }}</UiTag>
						</template>
					</div>

					<span class="cell cell--mono" :class="{ 'cell--dead': row.entry.deleted }">
						{{ row.third }}
					</span>
					<span
						v-if="kind === 'effects'"
						class="cell cell--mono"
						:class="{ 'cell--dead': row.entry.deleted }"
					>
						{{ row.uses }}
					</span>

					<span class="table__actions">
						<template v-if="!row.entry.deleted">
							<UiIconButton
								icon="pencil"
								size="sm"
								label="Изменить"
								@click.stop="editing = { entry: row.entry }"
							/>
							<UiIconButton
								icon="trash-2"
								size="sm"
								label="Удалить"
								@click.stop="store.setDeleted(kind, row.entry, true)"
							/>
						</template>
						<UiIconButton
							v-else
							icon="rotate-ccw"
							size="sm"
							label="Вернуть"
							@click.stop="store.setDeleted(kind, row.entry, false)"
						/>
					</span>
				</div>

				<div v-if="row.open" class="item__desc">
					<span class="item__label">Описание</span>
					<span class="item__text">{{ row.entry.description || 'Без описания' }}</span>
				</div>
			</div>

			<div v-if="!rows.length" class="table__empty">
					{{ query.trim() ? 'Ничего не найдено.' : 'Пусто. Нажми «Добавить».' }}
				</div>
		</div>
	</div>

	<FormDialog
		:open="!!editing"
		:title="dialogTitle"
		:fields
		:initial
		@close="editing = undefined"
		@save="onSave"
	/>
</template>

<style scoped>
.catalog {
	display: flex;
	flex-direction: column;
	gap: 16px;
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
	grid-template-columns: minmax(0, 1.5fr) minmax(0, 1.5fr) 120px 76px;
	gap: 12px;
	align-items: center;
}

.table__row--fx {
	grid-template-columns: minmax(0, 1.4fr) minmax(0, 1.4fr) 110px 110px 76px;
}

.table__row--head {
	padding: 12px 16px;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
	background: var(--surface-sunken);
}

.table__name-head {
	padding-left: 24px;
}

.table__row--body {
	min-height: 52px;
	padding: 10px 16px;
	cursor: pointer;
}

.table__row--body:hover {
	background: var(--surface-sunken);
}

.table__actions {
	display: flex;
	gap: 4px;
	justify-content: flex-end;
}

.table__empty {
	padding: 16px;
	font: var(--type-body-sm);
	color: var(--text-subtle);
	border-top: 1px solid var(--border-subtle);
}

.item {
	border-top: 1px solid var(--border-subtle);
}

.item--open {
	background: var(--surface-sunken);
}

.cell {
	min-width: 0;
}

.cell--dead {
	opacity: 0.5;
}

.cell--name {
	display: flex;
	align-items: flex-start;
	gap: 8px;
}

.cell__chevron {
	display: flex;
	flex: none;
	margin-top: 3px;
	color: var(--text-muted);
}

.cell__title {
	font: 600 15px / 1.45 var(--font-body);
	color: var(--text-strong);
}

.cell--tags {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.cell__text {
	font: var(--type-body-sm);
	color: var(--text-body);
}

.cell--mono {
	font: var(--type-mono);
	color: var(--text-muted);
}

.item__desc {
	display: flex;
	flex-direction: column;
	gap: 6px;
	max-width: 720px;
	padding: 0 16px 16px 40px;
}

.item__label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.item__text {
	font: var(--type-body-sm);
	color: var(--text-body);
	text-wrap: pretty;
}
</style>
