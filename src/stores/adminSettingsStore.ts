import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api-facade/api'
import type {
	Login,
	PartyMember,
	Rewards,
} from '../api-facade/contracts'
import type { HttpErrorResponse } from '../api-facade/http'
import { StoreName } from '../enums/storeName'
import { useCurrentGameStore } from './currentGameStore'
import { useTimerStore } from './timerStore'
import { useToastStore } from './toastStore'

const codeOf = (e: unknown) => (e as Partial<HttpErrorResponse>).body?.code

export const useAdminSettingsStore = defineStore(StoreName.AdminSettings, () => {
	const rewards = ref<Rewards>({ timer: [], game: [] })
	const members = ref<PartyMember[]>([])

	const loadRewards = async () => {
		rewards.value = await api.admin.rewards.get()
	}

	const loadMembers = async () => {
		members.value = await api.admin.members.list()
	}

	const saveRewards = async (
		value: Rewards,
		title: string,
		text: string,
		tone: 'success' | 'info' = 'success',
	) => {
		const toast = useToastStore()

		try {
			await api.admin.rewards.save(value)
			toast.show(title, text, tone)

			// the popovers of the current game and of the timer show these rewards
			await Promise.all([
				loadRewards(),
				useCurrentGameStore().load(),
				useTimerStore().load(),
			])
		} catch (e) {
			toast.error(e)
		}
	}

	const addMember = async (login: Login) => {
		const toast = useToastStore()

		try {
			await api.admin.members.add(login)
			toast.show('Игрок добавлен', login)
			await loadMembers()
			return true
		} catch (e) {
			if (codeOf(e) === 'ALREADY_MEMBER') {
				toast.show('Уже в пати', login, 'info')
			} else {
				toast.error(e)
			}

			return false
		}
	}

	const updateMember = async (
		member: PartyMember,
		input: { displayName: string | null; isAdmin: boolean },
	) => {
		const toast = useToastStore()

		try {
			await api.admin.members.update(member.login, input)
			toast.show('Сохранено', member.login)
			await loadMembers()
			return true
		} catch (e) {
			if (codeOf(e) === 'LAST_ADMIN') {
				toast.show('Нельзя снять админа', 'Это последний админ пати.', 'danger')
			} else {
				toast.error(e)
			}

			return false
		}
	}

	const removeMember = async (member: PartyMember) => {
		const toast = useToastStore()

		try {
			await api.admin.members.remove(member.login)
			toast.show('Удалён из пати', member.login, 'info')
			await loadMembers()
		} catch (e) {
			if (codeOf(e) === 'LAST_ADMIN') {
				toast.show('Нельзя удалить', 'Это последний админ пати.', 'danger')
			} else {
				toast.error(e)
			}
		}
	}

	return {
		rewards,
		members,
		loadRewards,
		loadMembers,
		saveRewards,
		addMember,
		updateMember,
		removeMember,
	}
})
