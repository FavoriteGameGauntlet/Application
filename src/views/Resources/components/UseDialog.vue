<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type {
	ItemCondition,
	ItemEntryRow,
	ItemUse,
	Login,
} from '../../../api-facade/contracts'
import FormDialog from '../../../components/FormDialog.vue'
import type {
	FormField,
	FormSection,
	FormValues,
} from '../../../components/formDialog'
import { useMembersStore } from '../../../stores/membersStore'
import { useResourcesStore } from '../../../stores/resourcesStore'
import { useSessionStore } from '../../../stores/sessionStore'
import { formatUsesLeft } from '../../../utils/formatResource'
import {
	allowedTargets,
	appliedEntries,
	needsTargets,
	useSlots,
} from '../../../utils/itemUse'

/** what is being used: an item copy or the ability of a perk */
export type UseSubject = {
	title: string
	text: string
	entries: ItemEntryRow[]
	/** false: the user picks which of the entries to apply */
	shouldApplyToAll: boolean
	conditions: ItemCondition[]
	/** the copy that is being used can be neither taken away nor copied by its own use */
	excludeCopyId?: number
}

type Props = {
	subject?: UseSubject
}

const { subject } = defineProps<Props>()

const emit = defineEmits<{ close: []; confirm: [use: ItemUse] }>()

const membersStore = useMembersStore()
const resourcesStore = useResourcesStore()
const sessionStore = useSessionStore()

/** what the form holds so far: the sections below are built from it */
const current = ref<FormValues>({})

const listOf = (values: FormValues, key: string) =>
	(values[key] as string[] | undefined) ?? []

const targets = computed(() => listOf(current.value, 'targets'))
/** the `entryId`s picked when the subject doesn't apply all its entries */
const pickedEntryIds = computed(() =>
	listOf(current.value, 'entries').map(Number),
)

const choosesEntries = computed(() => subject?.shouldApplyToAll === false)

/** targets and copies concern the applied entries only */
const entries = computed(() =>
	appliedEntries(
		subject?.entries ?? [],
		!choosesEntries.value,
		pickedEntryIds.value,
	),
)
const withTargets = computed(() => needsTargets(entries.value))

const candidates = computed(() =>
	allowedTargets(membersStore.list, sessionStore.login, subject?.conditions),
)

const nameOf = (login: Login) =>
	membersStore.list.find((m) => m.user.login === login)?.displayName ?? login

const slots = computed(() =>
	useSlots(entries.value, sessionStore.login, targets.value),
)

/** the copies of `login` an entry can take or copy; the copy that is being used is never one of them */
const copiesOf = (login: Login, itemId?: number) =>
	(resourcesStore.byUser[login]?.items ?? [])
		.filter(
			(i) =>
				(itemId === undefined || i.itemId === itemId) &&
				i.id !== subject?.excludeCopyId,
		)
		.map((i) => ({
			value: String(i.id),
			label: i.name,
			meta: formatUsesLeft(i),
		}))

/** `login` holds the copy that is being used, and an entry for `itemId` would offer it if it were allowed */
const holdsUsedCopy = (login: Login, itemId?: number) =>
	subject?.excludeCopyId !== undefined &&
	(resourcesStore.byUser[login]?.items ?? []).some(
		(i) =>
			i.id === subject?.excludeCopyId &&
			(itemId === undefined || i.itemId === itemId),
	)

/** the owner is in the key, so the copies picked for one player never carry over to another */
const slotKey = (index: number, owner: Login) => `slot-${index}-${owner}`

const fromKey = (index: number) => `from-${index}`

/** the entries that take copies away from each chosen player */
const takesFromTargets = computed(() =>
	entries.value.filter(
		(e) =>
			e.who === 'chosen' &&
			e.amount < 0 &&
			(e.kind === 'user-item' || e.kind === 'item'),
	),
)

/** a player whose inventory is not read yet is not blocked: nothing is known about it */
const lacksCopies = (login: Login, entries: ItemEntryRow[]) =>
	!!resourcesStore.byUser[login] &&
	entries.some(
		(e) =>
			copiesOf(login, e.kind === 'item' ? e.targetId : undefined).length <
			Math.abs(e.amount),
	)

/**
 * The backend refuses a copy named twice, so a copy that another slot takes
 * (whole, or by a pick) is not offered to this one: stealing the only item of
 * a player leaves nothing to duplicate.
 */
const rows = computed(() => {
	const takenWhole = new Set<string>()
	/** the slots that name a player go first: the one that copies from the whole party takes what is left */
	const order = slots.value
		.map((slot, index) => ({ slot, index }))
		.sort(
			(a, b) =>
				Number(a.slot.owner === 'party') - Number(b.slot.owner === 'party'),
		)

	const byIndex = order.map(({ slot, index }) => {
		const isParty = slot.owner === 'party'
		/** a slot that copies from the party asks whose copy first */
		const source = isParty
			? listOf(current.value, fromKey(index))[0]
			: undefined
		const owner = isParty ? source : slot.owner
		const key = slotKey(index, owner ?? 'party')
		const pickedElsewhere = new Set(
			Object.entries(current.value)
				.filter(([k]) => k.startsWith('slot-') && k !== key)
				.flatMap(([, ids]) => ids as string[]),
		)
		const all = owner ? copiesOf(owner, slot.itemId) : []
		const options = all.filter(
			(o) => !takenWhole.has(o.value) && !pickedElsewhere.has(o.value),
		)
		/** more copies than the entry takes, so the user picks which ones */
		const choose = options.length > slot.count

		if (owner && !choose) options.forEach((o) => takenWhole.add(o.value))

		return {
			index,
			row: {
				key,
				index,
				slot,
				isParty,
				/** the player the copy is taken from, once picked */
				owner,
				/** nobody is picked to copy from yet, so there are no copies to show */
				pending: !owner,
				options,
				choose,
				/** fewer copies than the entry takes */
				short: !!owner && options.length < slot.count,
				/** the copies would be enough, but other slots take them */
				taken:
					!!owner && all.length >= slot.count && options.length < slot.count,
				usedCopy: !!owner && holdsUsedCopy(owner, slot.itemId),
			},
		}
	})

	return byIndex.sort((a, b) => a.index - b.index).map(({ row }) => row)
})

const heading = (owner: Login, isParty: boolean) =>
	isParty
		? `Какой предмет скопировать у ${nameOf(owner)}`
		: `Что забрать у ${nameOf(owner)}`

const sections = computed<FormSection[]>(() => {
	const result: FormSection[] = []

	if (choosesEntries.value) {
		result.push({
			title: 'Что применить',
			fields: [
				{
					key: 'entries',
					label: 'Что применить',
					type: 'pick',
					required: 'пункт',
					options: (subject?.entries ?? []).map((e) => ({
						value: String(e.entryId),
						label: e.text ?? '',
					})),
				},
			],
		})
	}

	if (withTargets.value) {
		result.push({
			title: 'На кого',
			fields: [
				{
					key: 'targets',
					label: 'На кого',
					type: 'pick',
					required: 'цель',
					options: candidates.value.map((m) => ({
						value: m.user.login,
						label: m.displayName ?? m.user.login,
						color: membersStore.colorOf(m.user.login),
						...(lacksCopies(m.user.login, takesFromTargets.value) && {
							disabled: true,
							meta: 'нечего забрать',
						}),
					})),
					...(!candidates.value.length && {
						hint: 'Сейчас подходящих игроков нет.',
					}),
				},
			],
		})
	}

	// not in the order of the entries: what is taken from the chosen players follows «На кого», copying comes last
	const ordered = [
		...rows.value.filter((r) => !r.isParty),
		...rows.value.filter((r) => r.isParty),
	]

	for (const row of ordered) {
		if (row.isParty) {
			result.push({
				title: 'У кого скопировать',
				fields: [
					{
						key: fromKey(row.index),
						label: 'У кого скопировать',
						type: 'pick',
						limit: 1,
						required: 'игрок',
						options: membersStore.list.map((m) => {
							const login = m.user.login
							const blocked =
								!!resourcesStore.byUser[login] &&
								copiesOf(login, row.slot.itemId).length < row.slot.count

							return {
								value: login,
								label: m.displayName ?? login,
								color: membersStore.colorOf(login),
								...(blocked && {
									disabled: true,
									meta: holdsUsedCopy(login, row.slot.itemId)
										? 'используется'
										: 'нечего копировать',
								}),
							}
						}),
					},
				],
			})
		}

		if (!row.owner) continue

		const field: FormField = {
			key: row.key,
			label: heading(row.owner, row.isParty),
			type: 'pick',
			limit: row.slot.count,
			required: 'предмет',
			options: row.options,
			...(row.short && {
				invalid: true,
				hint: row.usedCopy
					? 'Нельзя выбрать предмет, который используете. Предметов для выбора нет.'
					: row.taken
						? 'Предметов для выбора нет: подходящий уже забирает другой пункт.'
						: `У ${nameOf(row.owner)} не хватает предметов.`,
			}),
		}

		result.push({ title: field.label, fields: [field] })
	}

	return result
})

/** a slot with exactly as many copies as it takes has nothing to choose, so they are picked from the start */
const initial = computed<FormValues>(() =>
	Object.fromEntries(
		rows.value
			.filter((r) => !r.pending && !r.choose && !r.short)
			.map((r) => [r.key, r.options.map((o) => o.value)]),
	),
)

const onChange = (values: FormValues) => {
	current.value = values
}

const onSave = (values: FormValues) => {
	const userItemIds = rows.value.flatMap((r) =>
		listOf(values, r.key).map(Number),
	)

	emit('confirm', {
		...(choosesEntries.value && {
			entryIds: listOf(values, 'entries').map(Number),
		}),
		...(withTargets.value && { targetLogins: listOf(values, 'targets') }),
		...(userItemIds.length > 0 && { userItemIds }),
	})
}

/** an inventory that is in the store may be old (it is read again only when someone looks at the player), so each one is read once per opening */
const refreshed = new Set<Login>()

watch(
	() => subject,
	() => {
		current.value = {}
		refreshed.clear()
	},
)

/** whose inventory the form reads: the owners of the slots, everyone to copy from, the players to take from */
const inventoriesNeeded = computed(() => [
	...new Set([
		...slots.value.flatMap((s) =>
			s.owner === 'party'
				? membersStore.list.map((m) => m.user.login)
				: [s.owner],
		),
		...(takesFromTargets.value.length
			? candidates.value.map((m) => m.user.login)
			: []),
	]),
])

watch(
	inventoriesNeeded,
	(logins) => {
		logins.forEach((login) => {
			if (refreshed.has(login)) return

			refreshed.add(login)
			resourcesStore.loadUser(login)
		})
	},
	{ immediate: true },
)
</script>

<template>
	<FormDialog
		:open="!!subject"
		:title="subject?.title ?? ''"
		:subtitle="subject?.text"
		:sections
		:initial
		submit-label="Использовать"
		:width="480"
		@close="emit('close')"
		@save="onSave"
		@change="onChange"
	/>
</template>
