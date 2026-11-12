import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api-facade/api'
import type { Login, PartyMember, Rewards } from '../api-facade/contracts'
import type { HttpErrorResponse } from '../api-facade/http'
import { StoreName } from '../enums/storeName'
import { useCurrentGameStore } from './currentGameStore'
import { useMembersStore } from './membersStore'
import { useTimerStore } from './timerStore'
import { useToastStore } from './toastStore'

const codeOf = (e: unknown) => (e as Partial<HttpErrorResponse>).body?.code

export const useAdminSettingsStore = defineStore(
	StoreName.AdminSettings,
	() => {
		const rewards = ref<Rewards>({
			timer: [],
			timer_created: [],
			game_completed: [],
			game_cancelled: [],
			game_rerolled: [],
		})
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
					useTimerStore().loadReward(),
				])
			} catch (e) {
				toast.error(e)
			}
		}

		/**
		 * The two refusals the admin can fix by retyping the login are returned for
		 * the field to show; any other failure is a toast here.
		 */
		const addMember = async (
			login: Login,
			color: string,
		): Promise<'added' | 'not-found' | 'already-member' | 'failed'> => {
			const toast = useToastStore()

			try {
				await api.admin.members.add(login, color)
				toast.show('Игрок добавлен', login)
				await loadMembers()
				return 'added'
			} catch (e) {
				const code = codeOf(e)

				if (code === 'USER_LOGIN_NOT_FOUND') return 'not-found'
				if (code === 'MEMBER_ALREADY_EXISTS') return 'already-member'

				toast.error(e)
				return 'failed'
			}
		}

		const updateMember = async (
			member: PartyMember,
			input: { displayName: string | null; isAdmin: boolean; color: string },
		) => {
			const toast = useToastStore()

			try {
				await api.admin.members.update(member.login, input)
				toast.show('Сохранено', member.login)
				await Promise.all([loadMembers(), useMembersStore().load()])
				return true
			} catch (e) {
				if (codeOf(e) === 'OWN_ADMIN_RIGHTS_REVOKE') {
					toast.show(
						'Нельзя снять админа',
						'Права админа с себя снять нельзя.',
						'danger',
					)
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
				await Promise.all([loadMembers(), useMembersStore().load()])
			} catch (e) {
				toast.error(e)
			}
		}

		const restoreMember = async (member: PartyMember) => {
			const toast = useToastStore()

			try {
				await api.admin.members.restore(member.login)
				toast.show('Игрок вернулся в пати', member.login)
				await Promise.all([loadMembers(), useMembersStore().load()])
			} catch (e) {
				toast.error(e)
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
			restoreMember,
		}
	},
)
