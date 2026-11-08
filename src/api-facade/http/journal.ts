import { formatResource } from '../../utils/formatResource'
import type {
	Api,
	GameEndState,
	JournalEntry,
	JournalSourceType,
	Login,
	PointType,
	ResourceRef,
} from '../contracts'
import { http } from '../http'
import { currentLogin, getPointTypes, partyPath } from './context'

type ResourceKindDto = 'point' | 'item' | 'perk' | 'effect'

type HistoryChangeDto = {
	/** absent for the points of the party */
	login?: Login | null
	resource: { kind: ResourceKindDto; id: number; name: string }
	/** a resource other than points: `changed` when only its uses left changed */
	action?: 'added' | 'removed' | 'changed' | null
	desiredChangeValue?: number | null
	actualChangeValue?: number | null
	finalValue?: number | null
}

type HistoryEventDto = {
	id: number
	createdDate: string
	actorLogin: Login
	source: { type: JournalSourceType; id?: number | null; name?: string | null }
	isManualChange: boolean
	correctsEntryId?: number | null
	/** set only on the event that ends a game */
	endState?: GameEndState | null
	changes?: HistoryChangeDto[]
}

type HistoryDto = { events?: HistoryEventDto[]; nextCursor?: number | null }

const resourceKindToDto = {
	points: 'point',
	item: 'item',
	perk: 'perk',
	effect: 'effect',
} as const satisfies Record<ResourceRef['kind'], ResourceKindDto>

const toChange = (
	change: HistoryChangeDto,
	pointTypes: PointType[],
): JournalEntry['changes'][number] => {
	const { kind, id, name } = change.resource
	const login = change.login ?? null

	if (kind === 'point') {
		const delta = change.actualChangeValue ?? 0
		const resource: ResourceRef = {
			kind: 'points',
			id,
			name,
			amount: Math.abs(delta),
		}

		return {
			login,
			text: `${delta < 0 ? '−' : '+'}${formatResource(resource, pointTypes)}`,
			resource,
		}
	}

	const resource: ResourceRef =
		kind === 'item' ? { kind, id, name, amount: 1 } : { kind, id, name }
	const label = formatResource(resource, pointTypes)

	return {
		login,
		text:
			change.action === 'added'
				? `+${label}`
				: change.action === 'removed'
					? `−${label}`
					: `${label} (использование)`,
		resource,
	}
}

const toJournalEntry = (
	event: HistoryEventDto,
	pointTypes: PointType[],
): JournalEntry => {
	const { source } = event

	return {
		id: event.id,
		at: event.createdDate,
		actor: event.actorLogin,
		source: {
			type: source.type,
			...(source.id != null && { id: source.id }),
			...(source.name != null && { name: source.name }),
			...(source.type === 'game' && { event: event.endState ?? 'started' }),
		},
		manual: event.isManualChange,
		...(event.correctsEntryId != null && {
			correctsEntryId: event.correctsEntryId,
		}),
		changes: (event.changes ?? []).map((c) => toChange(c, pointTypes)),
	}
}

export const journal: Api['journal'] = {
	list: async (query) => {
		const params = new URLSearchParams()

		if (query.user) params.set('user', query.user)
		if (query.resource) {
			params.set('resource[kind]', resourceKindToDto[query.resource.kind])
			if (query.resource.id !== undefined) {
				params.set('resource[id]', String(query.resource.id))
			}
		}
		if (query.source) params.set('source', query.source)
		if (query.from) params.set('from', query.from)
		if (query.to) params.set('to', query.to)
		if (query.limit !== undefined) params.set('limit', String(query.limit))
		if (query.cursor) params.set('cursor', query.cursor)

		const [{ body }, pointTypes] = await Promise.all([
			partyPath().then((path) =>
				http.get<{ response: HistoryDto }>(`${path}/history?${params}`),
			),
			getPointTypes(),
		])

		return {
			items: (body.events ?? []).map((e) => toJournalEntry(e, pointTypes)),
			...(body.nextCursor != null && { nextCursor: String(body.nextCursor) }),
		}
	},
}

/**
 * The create and use endpoints answer with an empty body, so the entry of the
 * action just made is read from the journal: the newest one the user started.
 */
export const latestOwnEntry = async (): Promise<JournalEntry> => {
	const login = await currentLogin()
	const { items } = await journal.list({ user: login, limit: 10 })
	const entry = items.find((e) => e.actor === login)

	if (!entry) throw new Error('The journal entry of the action is not found')

	return entry
}
