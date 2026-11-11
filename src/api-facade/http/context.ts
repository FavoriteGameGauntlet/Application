import { Temporal } from '@js-temporal/polyfill'
import { MEMBER_COLORS } from '../../constants/memberColors'
import { persistentStorage, StoreKey } from '../../services/persistentStorage'
import type {
	ISODate,
	Login,
	PointType,
	Seconds,
	UserRef,
	UserStatus,
} from '../contracts'
import { http } from '../http'

/** shown for a login that is not in the member list */
const FALLBACK_COLOR = MEMBER_COLORS[0]

export const currentLogin = async () => {
	const login = await persistentStorage.get(StoreKey.Login)

	if (login === undefined) throw new Error('The user is not logged in')

	return login
}

/** `/parties/{partyId}` of the party chosen with `parties.select` */
export const partyPath = async () => {
	const id = await persistentStorage.get(StoreKey.PartyId)

	if (id === undefined) throw new Error('The party is not selected')

	return `/parties/${id}`
}

/** an ISO 8601 duration ("PT2h10m5s") of the backend in seconds */
export const toSeconds = (duration: string): Seconds =>
	Temporal.Duration.from(duration).total('seconds')

export type MemberDto = {
	login: Login
	displayName?: string
	isAdmin: boolean
	joinedDate: ISODate
	/** null for a current member */
	leftDate: ISODate | null
	/** lowercase hex */
	color: string
	status: UserStatus
	/** the name of the current game */
	currentGame: string | null
	/** ISO 8601 duration */
	timeSpent: string
	completedCount: number
	spinsCount: number
}

/** the members of the party with those who left, the admins restore them from here */
export const getAllMembers = async () =>
	(await http.get<{ response: MemberDto[] }>(`${await partyPath()}/members`))
		.body

/** the current members: the backend lists the ones who left too */
export const getMembers = async () =>
	(await getAllMembers()).filter((m) => !m.leftDate)

export const userRefOf = (members: MemberDto[], login: Login): UserRef => ({
	login,
	color: members.find((m) => m.login === login)?.color ?? FALLBACK_COLOR,
})

export const getPointTypes = async () =>
	(
		await http.get<{ response: PointType[] }>(
			`${await partyPath()}/points/types`,
		)
	).body
