import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api-facade/api'
import type {
	ResourceRef,
	Payment,
	WheelGroup,
	WheelSpinResult,
} from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'
import {
	buildPayment,
	isPicked,
	paymentChoices,
	type PaymentChoice,
} from '../utils/payment'
import { RouteName } from '../router/routeNames'
import { router } from '../router/router'
import type { HttpErrorResponse } from '../api-facade/http'
import { useCurrentGameStore } from './currentGameStore'
import { useJournalStore } from './journalStore'
import { useManualStore } from './manualStore'
import { useMembersStore } from './membersStore'
import { useResourcesStore } from './resourcesStore'
import { useSessionStore } from './sessionStore'
import { useToastStore } from './toastStore'
import { useWishlistStore } from './wishlistStore'

export type WheelTab = 'points' | 'games'

const REROLL_START_DELAY_MS = 350

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useWheelStore = defineStore(StoreName.Wheel, () => {
	const tab = ref<WheelTab>('points')
	const groups = ref<WheelGroup[]>([])
	/** the selected group of the «points» tab */
	const groupId = ref<number>()
	/** the selected group of the «games» tab */
	const gameGroupId = ref<number>()

	const spinning = ref(false)
	const result = ref<WheelSpinResult | null>(null)
	/** the spin the tape is rolling to; it becomes the result when the tape lands */
	const landing = ref<WheelSpinResult | null>(null)
	let onLanded: (() => void) | undefined
	/** the groups or the spin of the selected group are on their way: the screen draws no cards until they are here */
	const loading = ref(false)
	/** the number of the last `restore`, an older one that comes back late is dropped */
	let restoreSeq = 0
	/** the cost rows with the copies to pick from, set while the choice dialog is open */
	const pendingChoices = ref<PaymentChoice[] | null>(null)
	/** the entries of the item that fell, set while the user picks which of them to apply */
	const pendingEntries = ref<ResourceRef[] | null>(null)
	/** what the user picked in the dialog above, kept until the apply is done */
	const pickedEntryIds = ref<number[]>()

	const changeGroups = computed(() =>
		groups.value.filter((g) => g.kind === 'changes'),
	)

	/** the wishlist goes first, then the groups of games of the party */
	const gameGroups = computed(() =>
		groups.value
			.filter((g) => g.kind !== 'changes')
			.sort(
				(a, b) => Number(b.kind === 'wishlist') - Number(a.kind === 'wishlist'),
			),
	)

	/** the selected source of the current tab */
	const group = computed(() =>
		(tab.value === 'games' ? gameGroups.value : changeGroups.value).find(
			(g) =>
				g.id === (tab.value === 'games' ? gameGroupId.value : groupId.value),
		),
	)

	/** the spin kept on the server, when it was made from the selected group */
	const shownResult = computed(() =>
		result.value?.source.groupId === group.value?.id ? result.value : null,
	)

	/** the tape of the spin that is rolling or shown, so it does not change with the group; else the pool of the group */
	const pool = computed(() => {
		const spun = landing.value ?? shownResult.value

		if (spun) return spun.entries

		return group.value?.kind === 'wishlist'
			? useWishlistStore().mine.map((g) => g.name)
			: (group.value?.entries.map((e) => e.name) ?? [])
	})

	const resultGroup = computed(() => {
		const source = result.value?.source

		return source && groups.value.find((g) => g.id === source.groupId)
	})

	/** the item that fell, with its entries; the names of the items of a party are unique */
	const resultEntry = computed(() =>
		resultGroup.value?.entries.find(
			(e) => e.name === result.value?.result.name,
		),
	)

	/** applying the result starts the game instead of granting changes */
	const resultStartsGame = computed(() => resultGroup.value?.kind !== 'changes')

	const load = async () => {
		groups.value = await api.wheel.groups()
		groupId.value ??= changeGroups.value[0]?.id
		gameGroupId.value ??= gameGroups.value[0]?.id

		await useWishlistStore().loadMine()
	}

	/** shows the spin the server keeps for the selected group, after a restart or a switch for example */
	const restore = async () => {
		const selected = group.value
		const seq = ++restoreSeq

		if (!selected || spinning.value) {
			loading.value = false
			return
		}

		loading.value = true

		try {
			const last = await api.wheel.lastSpin({
				groupId: selected.id,
				kind: selected.kind,
			})

			// a later switch or a spin took over while the answer was on its way
			if (seq !== restoreSeq) return

			result.value = last
		} catch (e) {
			if (seq === restoreSeq) useToastStore().error(e)
		} finally {
			if (seq === restoreSeq) loading.value = false
		}
	}

	/** the screen opens empty and draws the groups and the spin of the selected one once, so a shown spin does not blink in */
	const open = async () => {
		loading.value = true

		try {
			await load()
		} catch (e) {
			loading.value = false
			useToastStore().error(e)
			return
		}

		await restore()
	}

	/** «Сбросить»: the result goes from the screen and from the server */
	const discardResult = async () => {
		const discarded = result.value

		if (!discarded) return

		try {
			await api.wheel.discard(discarded.source.groupId)
			result.value = null
		} catch (e) {
			useToastStore().error(e)
		}
	}

	const setTab = (value: WheelTab) => {
		if (spinning.value) return

		tab.value = value
		void restore()
	}

	const setGroup = (id: number) => {
		if (spinning.value) return

		if (tab.value === 'games') {
			gameGroupId.value = id
		} else {
			groupId.value = id
		}

		void restore()
	}

	/** the tape calls it when it stops on the spun entry, or when it is gone before that */
	const landed = () => {
		if (!landing.value) return

		result.value = landing.value
		landing.value = null
		spinning.value = false
		onLanded?.()
		onLanded = undefined
	}

	const roll = (spin: WheelSpinResult) =>
		new Promise<void>((resolve) => {
			onLanded = resolve
			landing.value = spin
		})

	const spin = async () => {
		const source = group.value

		if (spinning.value || !source || !pool.value.length) return

		// a spin replaces whatever a restore of the group is still bringing
		restoreSeq++
		loading.value = false
		spinning.value = true
		result.value = null

		try {
			await roll(
				await api.wheel.spin({ groupId: source.id, kind: source.kind }),
			)
		} catch (e) {
			spinning.value = false

			if (
				(e as HttpErrorResponse).body?.code === 'CURRENT_GAME_ALREADY_EXISTS'
			) {
				useToastStore().show(
					'Идёт игра',
					'Колесо игр можно крутить, когда текущая игра закончена.',
					'danger',
				)
			} else {
				useToastStore().error(e)
			}
		}
	}

	/** opens the games tab and spins it, used after the current game is rerolled */
	const spinGames = async () => {
		tab.value = 'games'
		result.value = null

		// the groups may not be loaded yet when the wheel was never opened
		await Promise.all([router.push({ name: RouteName.Wheel }), load()])

		gameGroupId.value =
			gameGroups.value.find((g) => g.kind === 'wishlist')?.id ??
			gameGroupId.value

		if (!pool.value.length) {
			useToastStore().show(
				'Список желаемого пуст',
				'Перекручивать не из чего.',
				'danger',
			)
			return
		}

		await sleep(REROLL_START_DELAY_MS)
		await spin()
	}

	/** the user picks which entries to apply, and what to give when the cost can be paid with different copies */
	const apply = async () => {
		const applied = result.value
		const toast = useToastStore()

		if (!applied) return

		const entry = resultEntry.value

		if (entry?.shouldApplyToAll === false && !pickedEntryIds.value) {
			pendingEntries.value = entry.entries ?? []
			return
		}

		const cost =
			groups.value.find((g) => g.id === applied.source.groupId)?.cost ?? []

		if (!cost.length) return applySpin(applied)

		const resourcesStore = useResourcesStore()

		try {
			await resourcesStore.loadMine()
		} catch (e) {
			pickedEntryIds.value = undefined
			toast.error(e)
			return
		}

		const mine = resourcesStore.byUser[useSessionStore().login]
		const choices = paymentChoices(cost, mine)

		if (choices.some(isPicked)) {
			pendingChoices.value = choices
			return
		}

		await applySpin(applied, buildPayment(choices, {}))
	}

	const confirmPayment = async (picked: Record<number, number[]>) => {
		const choices = pendingChoices.value
		const applied = result.value

		pendingChoices.value = null

		if (choices && applied)
			await applySpin(applied, buildPayment(choices, picked))
	}

	const cancelPayment = () => {
		pendingChoices.value = null
		pickedEntryIds.value = undefined
	}

	const confirmEntries = async (entryIds: number[]) => {
		pendingEntries.value = null
		pickedEntryIds.value = entryIds

		await apply()
	}

	const cancelEntries = () => {
		pendingEntries.value = null
	}

	const applySpin = async (applied: WheelSpinResult, payment?: Payment) => {
		const group = resultGroup.value?.name ?? ''
		const toast = useToastStore()

		// the backend takes targets for a group of changes only (and requires them);
		// the design has no picker yet, so the change goes to the one who spun
		const startsGame = resultStartsGame.value
		const targetLogins = startsGame ? undefined : [useSessionStore().login]

		const entryIds = pickedEntryIds.value

		pickedEntryIds.value = undefined

		try {
			await api.wheel.apply(applied.source.groupId, {
				payment,
				targetLogins,
				entryIds,
			})

			result.value = null

			// the server keeps the spin after the apply, and a restored one could be applied twice
			await api.wheel.discard(applied.source.groupId).catch(() => undefined)

			if (startsGame) {
				if (payment) {
					await useResourcesStore().loadMine()
					useJournalStore().bump()
				}

				toast.show(
					`Новая игра: ${applied.result.name}`,
					'Выпала на колесе. Таймер с нуля.',
				)

				await Promise.all([
					useCurrentGameStore().load(),
					useWishlistStore().loadMine(),
					useMembersStore().load(),
				])
			} else {
				await useResourcesStore().loadMine()
				useJournalStore().bump()

				if (applied.result.isManualChange) {
					await useManualStore().startWheel({
						name: applied.result.name,
						group,
						description:
							applied.result.description ?? `Эффект из группы «${group}».`,
					})
				} else {
					toast.show('Применено', applied.result.name)
				}
			}
		} catch (e) {
			toast.error(e)
		}
	}

	return {
		tab,
		changeGroups,
		gameGroups,
		group,
		loading,
		spinning,
		result,
		shownResult,
		landing,
		pool,
		resultEntry,
		resultStartsGame,
		pendingChoices,
		pendingEntries,
		open,
		setTab,
		setGroup,
		discardResult,
		spin,
		landed,
		spinGames,
		apply,
		confirmPayment,
		cancelPayment,
		confirmEntries,
		cancelEntries,
	}
})
