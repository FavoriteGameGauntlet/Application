import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api-facade/api'
import type { WheelGroup, WheelSpinResult } from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'
import { RouteName } from '../router/routeNames'
import { router } from '../router/router'
import { useCurrentGameStore } from './currentGameStore'
import { useJournalStore } from './journalStore'
import { useMembersStore } from './membersStore'
import { useToastStore } from './toastStore'
import { useWishlistStore } from './wishlistStore'
import { useTimerStore } from './timerStore'

export type WheelTab = 'points' | 'games'

const MIN_STEPS = 18
const REROLL_START_DELAY_MS = 350

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useWheelStore = defineStore(StoreName.Wheel, () => {
	const tab = ref<WheelTab>('points')
	const groups = ref<WheelGroup[]>([])
	const groupId = ref<string>()

	const pos = ref(0)
	const spinning = ref(false)
	const result = ref<WheelSpinResult | null>(null)
	/** reel of the last spin; falls back to the pool of the selected source */
	const spunEntries = ref<string[] | null>(null)

	const group = computed(() => groups.value.find((g) => g.id === groupId.value))

	const pool = computed(
		() =>
			spunEntries.value ??
			(tab.value === 'games'
				? useWishlistStore().mine.map((g) => g.name)
				: (group.value?.entries.map((e) => e.name) ?? [])),
	)

	/** what the result card shows after «Выпало ·» */
	const resultSource = computed(() => {
		const source = result.value?.source

		if (!source) return ''
		if (source === 'wishlist') return 'Вишлист'

		return groups.value.find((g) => g.id === source.groupId)?.name ?? ''
	})

	const load = async () => {
		groups.value = await api.wheel.groups()
		groupId.value ??= groups.value[0]?.id

		await useWishlistStore().loadMine()
	}

	/** drops the shown result; the server spin is discarded on the best-effort basis */
	const clearResult = () => {
		if (result.value) {
			api.wheel.discard(result.value.spinId).catch(() => {})
		}

		result.value = null
		spunEntries.value = null
	}

	const setTab = (value: WheelTab) => {
		if (spinning.value) return

		tab.value = value
		pos.value = 0
		clearResult()
	}

	const setGroup = (id: string) => {
		if (spinning.value) return

		groupId.value = id
		pos.value = 0
		clearResult()
	}

	const animate = (spin: WheelSpinResult) =>
		new Promise<void>((resolve) => {
			const n = spin.entries.length

			spunEntries.value = spin.entries
			pos.value %= n

			let total = (spin.resultIndex - pos.value + n) % n
			while (total < MIN_STEPS) total += n

			let i = 0

			const step = () => {
				i++
				pos.value = (pos.value + 1) % n

				if (i < total) {
					setTimeout(step, 35 + 300 * Math.pow(i / total, 3))
				} else {
					result.value = spin
					spinning.value = false
					resolve()
				}
			}

			step()
		})

	const spin = async () => {
		if (spinning.value || !pool.value.length) return

		spinning.value = true
		result.value = null

		try {
			await animate(
				await api.wheel.spin(
					tab.value === 'games' ? 'wishlist' : { groupId: groupId.value! },
				),
			)
		} catch (e) {
			spinning.value = false
			useToastStore().error(e)
		}
	}

	/** plays a spin that was made on the server elsewhere, e.g. a game reroll */
	const playSpin = async (spin: WheelSpinResult) => {
		tab.value = 'games'
		spunEntries.value = null
		result.value = null
		pos.value = 0
		spinning.value = true

		await router.push({ name: RouteName.Wheel })
		await sleep(REROLL_START_DELAY_MS)
		await animate(spin)
	}

	const apply = async () => {
		const applied = result.value
		const toast = useToastStore()

		if (!applied) return

		try {
			await api.wheel.apply(applied.spinId)

			result.value = null
			spunEntries.value = null

			if (applied.source === 'wishlist') {
				toast.show(
					`Новая игра: ${applied.result.name}`,
					'Выпала на колесе. Таймер с нуля.',
				)

				await Promise.all([
					useCurrentGameStore().load(),
					useTimerStore().load(),
					useWishlistStore().loadMine(),
					useMembersStore().load(),
				])
			} else {
				toast.show('Отправлено админу', applied.result.name)
				useJournalStore().bump()
			}
		} catch (e) {
			toast.error(e)
		}
	}

	return {
		tab,
		groups,
		groupId,
		pos,
		spinning,
		result,
		pool,
		resultSource,
		load,
		setTab,
		setGroup,
		clearResult,
		spin,
		playSpin,
		apply,
	}
})
