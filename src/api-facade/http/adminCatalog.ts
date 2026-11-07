import type {
	Api,
	CatalogEntry,
	CatalogEntryInput,
	CatalogKind,
	PointType,
	ResourceKind,
} from '../contracts'
import { http } from '../http'
import {
	type CatalogDto,
	countHolders,
	countPointHolders,
	toCatalogEntry,
	toPointTypeEntry,
} from './catalogEntries'
import { getPointTypes, partyPath } from './context'
import { fromItemEntryRow } from './rows'

const catalogPath = {
	'point-types': '/points/types',
	items: '/items/catalog',
	effects: '/effects/catalog',
	perks: '/perks/catalog',
} as const satisfies Record<CatalogKind, string>

type ResourceCatalogKind = Exclude<CatalogKind, 'point-types'>

const withHolders = (entries: CatalogEntry[], holders: Map<number, number>) =>
	entries.map((e) => ({ ...e, holdersTotal: holders.get(e.id) ?? 0 }))

const listResources = async (
	kind: ResourceCatalogKind,
	includeDeleted: boolean,
) => {
	const path = await partyPath()
	const [active, removed, pointTypes, holders] = await Promise.all([
		http.get<{ response: CatalogDto[ResourceKind][] }>(
			`${path}${catalogPath[kind]}`,
		),
		includeDeleted
			? http.get<{ response: CatalogDto[ResourceKind][] }>(
					`${path}${catalogPath[kind]}/removed`,
				)
			: undefined,
		getPointTypes(),
		countHolders(kind),
	])
	const entries = (dtos: CatalogDto[ResourceKind][], deleted: boolean) =>
		dtos.map((dto) => ({ ...toCatalogEntry(kind, dto, pointTypes), deleted }))

	return withHolders(
		[...entries(active.body, false), ...entries(removed?.body ?? [], true)],
		holders,
	)
}

const listPointTypes = async (includeDeleted: boolean) => {
	// the backend lists only the point types that are not removed
	if (includeDeleted) {
		throw new Error('The backend has no list of the removed point types')
	}

	const [types, holders] = await Promise.all([
		getPointTypes(),
		countPointHolders(),
	])

	return withHolders(types.map(toPointTypeEntry), holders)
}

const pointTypeBody = (input: CatalogEntryInput) => ({
	name: input.name,
	description: input.description,
	startValue: input.startValue ?? 0,
	isPublic: input.isPublic ?? true,
	minimum: input.minimum ?? null,
	maximum: input.maximum ?? null,
	unitForms: input.unitForms ?? {
		one: input.name,
		several: input.name,
		many: input.name,
	},
})

/** the request body of a resource of the catalogue, only the fields the backend takes */
const resourceBody = (kind: ResourceCatalogKind, input: CatalogEntryInput) => {
	const { name, description } = input

	switch (kind) {
		case 'items':
			return {
				name,
				description,
				usesMax: input.usesMax ?? 1,
				entries: (input.entries ?? []).map(fromItemEntryRow),
				conditions: input.conditions ?? [],
			}
		case 'effects':
			return {
				name,
				description,
				...(input.duration != null && { durationInSeconds: input.duration }),
				...(input.modifiers?.length && {
					modifiers: input.modifiers.map(({ pointTypeId, amount }) => ({
						pointTypeId,
						amount,
					})),
				}),
			}
		case 'perks': {
			const { ability } = input

			return {
				name,
				description,
				...(input.modifiers?.length && {
					modifiers: input.modifiers.map(({ pointTypeId, amount }) => ({
						pointTypeId,
						amount,
					})),
				}),
				...(ability && {
					ability: {
						entries: ability.entries.map(fromItemEntryRow),
						...(ability.uses && { uses: ability.uses }),
						chargesMax: ability.chargesMax,
						...(ability.renewalPeriod !== undefined && {
							renewalPeriodInSeconds: ability.renewalPeriod,
						}),
					},
				}),
			}
		}
	}
}

export const adminCatalog: Pick<
	Api['admin']['catalog'],
	'list' | 'create' | 'update' | 'remove'
> = {
	list: (kind, includeDeleted) =>
		kind === 'point-types'
			? listPointTypes(includeDeleted)
			: listResources(kind, includeDeleted),

	create: async (kind, input) => {
		const path = `${await partyPath()}${catalogPath[kind]}`

		if (kind === 'point-types') {
			const { body } = await http.post<{ response: PointType }>(path, {
				body: { ...pointTypeBody(input), isShared: input.isShared ?? false },
			})

			return toPointTypeEntry(body)
		}

		const [{ body }, pointTypes] = await Promise.all([
			http.post<{ response: CatalogDto[ResourceKind] }>(path, {
				body: resourceBody(kind, input),
			}),
			getPointTypes(),
		])

		return toCatalogEntry(kind, body, pointTypes)
	},

	update: async (kind, id, input) => {
		if (kind !== 'point-types') {
			throw new Error(
				'The backend cannot change an item, a perk or an effect: remove it and add a new one',
			)
		}

		await http.patch(`${await partyPath()}${catalogPath[kind]}/${id}`, {
			body: pointTypeBody(input),
		})

		const type = (await getPointTypes()).find((t) => t.id === id)

		if (!type) throw new Error('The point type is not found')

		return toPointTypeEntry(type)
	},

	remove: async (kind, id) => {
		await http.delete(`${await partyPath()}${catalogPath[kind]}/${id}`)
	},
}
