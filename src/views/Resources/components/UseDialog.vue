<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type {
	ItemCondition,
	ItemEntryRow,
	ItemUse,
	Login,
} from '../../../api-facade/contracts'
import UiButton from '../../../components/ui/UiButton.vue'
import UiCheckbox from '../../../components/ui/UiCheckbox.vue'
import UiDialog from '../../../components/ui/UiDialog.vue'
import { useMembersStore } from '../../../stores/membersStore'
import { useResourcesStore } from '../../../stores/resourcesStore'
import { useSessionStore } from '../../../stores/sessionStore'
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
	/** the copy that is being used can't pay for its own use */
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

const targets = ref<Login[]>([])
/** the `entryId`s picked when the subject doesn't apply all its entries */
const pickedEntryIds = ref<number[]>([])
/** the ids picked for the slots that need a choice, by the index of the slot */
const picked = reactive<Record<number, number[]>>({})

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

const copiesOf = (owner: Login | 'party', itemId?: number) =>
	(owner === 'party'
		? membersStore.list.map((m) => m.user.login)
		: [owner]
	).flatMap((login) =>
		(resourcesStore.byUser[login]?.items ?? [])
			.filter(
				(i) =>
					(itemId === undefined || i.itemId === itemId) &&
					i.id !== subject?.excludeCopyId,
			)
			.map((i) => ({
				id: i.id,
				label: `${i.name} · осталось ${i.usesLeft} из ${i.usesMax}${owner === 'party' ? ` · ${nameOf(login)}` : ''}`,
			})),
	)

const rows = computed(() =>
	slots.value.map((slot, index) => {
		const options = copiesOf(slot.owner, slot.itemId)

		return {
			index,
			slot,
			options,
			/** more copies than the entry takes, so the user picks which ones */
			choose: options.length > slot.count,
			/** fewer copies than the entry takes */
			short: options.length < slot.count,
		}
	}),
)

const chosenRows = computed(() => rows.value.filter((r) => r.choose))
const shortRows = computed(() => rows.value.filter((r) => r.short))

const heading = (owner: Login | 'party', count: number) =>
	owner === 'party'
		? `Какой предмет скопировать · выбери ${count}`
		: `Что забрать у ${nameOf(owner)} · выбери ${count}`

const canConfirm = computed(
	() =>
		(!choosesEntries.value || pickedEntryIds.value.length > 0) &&
		(!withTargets.value || targets.value.length > 0) &&
		shortRows.value.length === 0 &&
		chosenRows.value.every((r) => picked[r.index]?.length === r.slot.count),
)

const isFull = (index: number, count: number) =>
	(picked[index]?.length ?? 0) >= count

const toggle = (index: number, id: number, on: boolean) => {
	const ids = picked[index] ?? []

	picked[index] = on ? [...ids, id] : ids.filter((x) => x !== id)
}

const toggleEntry = (entryId: number, on: boolean) => {
	pickedEntryIds.value = on
		? [...pickedEntryIds.value, entryId]
		: pickedEntryIds.value.filter((x) => x !== entryId)
}

const toggleTarget = (login: Login, on: boolean) => {
	targets.value = on
		? [...targets.value, login]
		: targets.value.filter((l) => l !== login)
}

const onConfirm = () => {
	const userItemIds = rows.value.flatMap((r) =>
		r.choose ? (picked[r.index] ?? []) : r.options.map((o) => o.id),
	)

	emit('confirm', {
		...(choosesEntries.value && { entryIds: pickedEntryIds.value }),
		...(withTargets.value && { targetLogins: targets.value }),
		...(userItemIds.length > 0 && { userItemIds }),
	})
}

const resetPicks = () => {
	Object.keys(picked).forEach((key) => delete picked[Number(key)])
}

watch(
	() => subject,
	() => {
		targets.value = []
		pickedEntryIds.value = []
		resetPicks()
	},
)

// the slots follow the named users and the applied entries, so the copies picked for the old ones are dropped
watch([targets, pickedEntryIds], resetPicks)

// the inventories the slots take from
watch(
	slots,
	(list) => {
		const logins = new Set(
			list.flatMap((s) =>
				s.owner === 'party'
					? membersStore.list.map((m) => m.user.login)
					: [s.owner],
			),
		)

		logins.forEach((login) => {
			if (!resourcesStore.byUser[login]) resourcesStore.loadUser(login)
		})
	},
	{ immediate: true },
)
</script>

<template>
	<UiDialog
		:open="!!subject"
		:title="subject?.title ?? ''"
		:width="460"
		@close="emit('close')"
	>
		<div class="dialog">
			<div class="dialog__block">
				<span class="label">Что произойдёт</span>
				<span class="dialog__text">{{ subject?.text }}</span>
			</div>

			<div v-if="choosesEntries" class="dialog__block">
				<span class="label">Что применить</span>

				<UiCheckbox
					v-for="entry in subject?.entries"
					:key="entry.entryId"
					:label="entry.text ?? ''"
					:model-value="pickedEntryIds.includes(entry.entryId!)"
					@update:model-value="toggleEntry(entry.entryId!, $event)"
				/>
			</div>

			<div v-if="withTargets" class="dialog__block">
				<span class="label">Кому</span>

				<UiCheckbox
					v-for="member in candidates"
					:key="member.user.login"
					:label="member.displayName ?? member.user.login"
					:model-value="targets.includes(member.user.login)"
					@update:model-value="toggleTarget(member.user.login, $event)"
				/>

				<span v-if="!candidates.length" class="dialog__note">
					Сейчас подходящих игроков нет.
				</span>
			</div>

			<div v-for="row in chosenRows" :key="row.index" class="dialog__block">
				<span class="label">
					{{ heading(row.slot.owner, row.slot.count) }}
				</span>

				<UiCheckbox
					v-for="option in row.options"
					:key="option.id"
					:label="option.label"
					:model-value="picked[row.index]?.includes(option.id) ?? false"
					:disabled="
						!picked[row.index]?.includes(option.id) &&
						isFull(row.index, row.slot.count)
					"
					@update:model-value="toggle(row.index, option.id, $event)"
				/>
			</div>

			<span
				v-for="row in shortRows"
				:key="`short-${row.index}`"
				class="dialog__note dialog__note--danger"
			>
				{{
					row.slot.owner === 'party'
						? 'В пати не хватает предметов.'
						: `У ${nameOf(row.slot.owner)} не хватает предметов.`
				}}
			</span>
		</div>

		<template #footer>
			<UiButton variant="ghost" @click="emit('close')">Отмена</UiButton>
			<UiButton :disabled="!canConfirm" @click="onConfirm">
				Использовать
			</UiButton>
		</template>
	</UiDialog>
</template>

<style scoped>
.dialog {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.dialog__block {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.dialog__text {
	font: var(--type-body);
	color: var(--text-body);
}

.dialog__note {
	font: var(--type-body-sm);
	color: var(--text-muted);
}

.dialog__note--danger {
	color: var(--danger-text);
}
</style>
