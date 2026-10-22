<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogEntry, CatalogEntryInput, CatalogKind } from '../../../api-facade/contracts'
import type { FormField, FormValues } from '../../../components/formDialog'
import FormDialog from '../../../components/FormDialog.vue'
import { useAdminCatalogStore } from '../../../stores/adminCatalogStore'
import { useToastStore } from '../../../stores/toastStore'
import { formatSpan, parseSpan } from '../../../utils/format'

type Props = {
	open: boolean
	kind: CatalogKind
	/** undefined is a new entry */
	entry?: CatalogEntry
	/** a new point type is created shared by default */
	shared?: boolean
}

const { open, kind, entry, shared = false } = defineProps<Props>()

const emit = defineEmits<{ close: [] }>()

const store = useAdminCatalogStore()
const toastStore = useToastStore()

const adds: Record<CatalogKind, string> = {
	'point-types': 'Новый тип очков',
	items: 'Новый предмет',
	effects: 'Новый эффект',
	perks: 'Новый перк',
}

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
				...(entry
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

const initial = computed<FormValues>(() => ({
	name: entry?.name ?? '',
	description: entry?.description ?? '',
	unit1: entry?.unitForms?.one ?? '',
	unit2: entry?.unitForms?.several ?? '',
	unit5: entry?.unitForms?.many ?? '',
	changes: entry?.changes ?? [],
	duration: entry?.duration ? formatSpan(entry.duration) : '',
	usesMax: entry?.usesMax != null ? String(entry.usesMax) : '',
	perkKind: entry?.perkKind ?? 'active',
	startValue: entry?.startValue != null ? String(entry.startValue) : '',
	minimum: entry?.minimum != null ? String(entry.minimum) : '',
	maximum: entry?.maximum != null ? String(entry.maximum) : '',
	isPublic: entry?.isPublic ?? true,
	isShared: shared,
}))

const title = computed(() => (entry ? `Изменить «${entry.name}»` : adds[kind]))

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

		input.unitForms = { one: text('unit1'), several: text('unit2'), many: text('unit5') }
		input.startValue = startValue
		input.minimum = minimum
		input.maximum = maximum
		input.isPublic = values.isPublic === true

		if (!entry) input.isShared = values.isShared === true
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

	if (await store.saveEntry(kind, entry?.id, input)) emit('close')
}
</script>

<template>
	<FormDialog :open :title :fields :initial @close="emit('close')" @save="onSave" />
</template>
