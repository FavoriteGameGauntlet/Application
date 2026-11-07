import type {
	AdminWheelGroup,
	CatalogEntry,
	ChangeRow,
	CatalogKind,
	Party,
	PartyMember,
	ResourceRef,
	Rewards,
	SystemParam,
} from '../contracts'
import * as db from './db'

export type PartyDef = Omit<Party, 'current'>

export const parties: PartyDef[] = [
	{
		id: 1,
		name: 'Осенний сезон',
		membersCount: 6,
		createdAt: '2026-08-25T12:00:00Z',
		startsAt: '2026-09-01T12:00:00Z',
		endsAt: '2026-11-15T12:00:00Z',
		status: 'active',
		role: 'admin',
	},
	{
		id: 2,
		name: 'Летний сезон',
		membersCount: 5,
		createdAt: '2026-05-25T12:00:00Z',
		startsAt: '2026-06-01T12:00:00Z',
		endsAt: '2026-08-31T12:00:00Z',
		status: 'finished',
		role: 'user',
	},
	{
		id: 3,
		name: 'Рабочая пати',
		membersCount: 9,
		createdAt: '2026-08-25T12:00:00Z',
		startsAt: '2026-09-01T12:00:00Z',
		endsAt: '2026-11-30T12:00:00Z',
		status: 'active',
		role: 'user',
	},
]

// ---- catalogs

const item = (
	name: string,
	changes: string[],
	description: string,
	id = db.itemCatalog[name].id,
): CatalogEntry => ({
	id,
	name,
	description,
	deleted: false,
	changes,
	usesMax: db.itemCatalog[name]?.usesMax ?? 1,
})

const effect = (
	name: string,
	changes: string[],
	duration: number | null,
	description: string,
): CatalogEntry => ({
	id: db.effectRef(name).id,
	name,
	description,
	deleted: false,
	changes,
	duration,
})

const perk = (
	name: string,
	id: number,
	changes: string[],
	perkKind: 'active' | 'passive',
	description: string,
): CatalogEntry => ({ id, name, description, deleted: false, changes, perkKind })

export const catalog: Record<CatalogKind, CatalogEntry[]> = {
	'point-types': db.pointTypes.map((type) => ({
		id: type.id,
		name: type.name,
		description: type.description,
		deleted: false,
		unitForms: type.unitForms,
		startValue: type.startValue,
		isPublic: type.isPublic,
		isShared: type.isShared,
		minimum: type.minimum,
		maximum: type.maximum,
	})),

	items: [
		item(
			'Свиток удачи',
			['+50 Золото'],
			'Разовая прибавка к золоту. Можно читать в любой момент.',
		),
		item(
			'Билет на колесо',
			['+1 прокрут колеса'],
			'Лишний прокрут, когда колесо уже прокручено.',
		),
		item(
			'Щит',
			['Щит · 1 день'],
			'Сутки защищает от проклятий и других негативных предметов.',
		),
		item(
			'Проклятие',
			['−30 Золото'],
			'Снимает золото у того, кто его использовал. Не сработает, если есть Щит.',
		),
		item(
			'Колобок',
			['50%: +3 Золото', '50%: Колобок → другому игроку'],
			'Азартный предмет: либо очки тебе, либо Колобок уходит дальше по кругу.',
		),
		item(
			'Кубик реролла',
			['+1 перекрут колеса'],
			'Перекручивает последний результат колеса без штрафа.',
		),
		item(
			'Свиток пропуска',
			['снять текущую игру', 'без штрафа'],
			'Когда игра совсем не идёт: снимает её без штрафа, можно крутить новую.',
		),
		{
			...item(
				'Монета судьбы',
				['50%: ×2 золото', '50%: −100% Золото за таймер'],
				'Ставка на следующий таймер: двойное золото или ничего.',
				8,
			),
			deleted: true,
		},
	],

	effects: [
		effect(
			'×2 золото',
			['Золото за таймер ×2'],
			2 * 3600,
			'Пока действует, каждый таймер приносит двойное золото.',
		),
		effect(
			'Щит',
			['блок негативных предметов'],
			24 * 3600,
			'Проклятия и похожие предметы на тебя не действуют.',
		),
		effect(
			'Проклятие',
			['Золото за таймер −10%'],
			3 * 3600,
			'Таймеры приносят меньше золота, пока не кончится срок.',
		),
		effect(
			'Знак дуэлянта',
			['+1 к броску в дуэли'],
			null,
			'Постоянное преимущество в дуэлях на кубиках.',
		),
		effect(
			'Заморозка',
			['пауза таймера', 'прогресс сохраняется'],
			null,
			'Можно отойти от игры, и таймер не сбросится.',
		),
		effect(
			'−10% очков',
			['начисления очков −10%'],
			6 * 3600,
			'Все начисления очков на 10% меньше.',
		),
	],

	perks: [
		perk(
			'Везунчик',
			db.perkCatalog['Везунчик'].id,
			['Бесплатный перекрут'],
			'active',
			'Можно перекрутить колесо бесплатно.',
		),
		perk(
			'Марафонец',
			db.perkCatalog['Марафонец'].id,
			['Второе дыхание'],
			'passive',
			'Награда за долгие сессии: +10% золота за таймер дольше 3 ч, дольше 5 ч ещё +1 билет.',
		),
		perk(
			'Коллекционер',
			db.perkCatalog['Коллекционер'].id,
			['Трофей'],
			'passive',
			'За каждую пройденную игру — случайный предмет.',
		),
		perk(
			'Щедрый',
			4,
			['Подарок'],
			'active',
			'Можно передать предмет другому игроку.',
		),
	],
}

/** the exchanges that the admin deleted, the users don't see them */
export const deletedExchangeIds = new Set<number>()

// ---- wheel

const refText = (ref: ResourceRef) => {
	switch (ref.kind) {
		case 'points':
		case 'item':
			return `${ref.amount < 0 ? '−' : '+'}${Math.abs(ref.amount)} ${ref.name}`
		case 'perk':
			return `перк ${ref.name}`
		case 'effect':
			return ref.name
	}
}

/** the refs of the mock catalogue as the rows of the contract; a perk or an effect has no amount */
const toChangeRow = (ref: ResourceRef): ChangeRow => ({
	kind: ref.kind,
	targetId: ref.id,
	amount: 'amount' in ref ? ref.amount : 1,
})

const NO_REPEAT_GROUPS = ['Штрафы', 'Перки']

const changeGroup = (group: db.WheelGroupDef): AdminWheelGroup => ({
	id: group.id,
	name: group.name,
	kind: 'changes',
	system: false,
	noRepeat: NO_REPEAT_GROUPS.includes(group.name),
	entries: group.entries.map((entry) => ({
		id: entry.id,
		name: entry.name,
		description: entry.description,
		changes: (entry.entries ?? []).map(refText),
		entries: (entry.entries ?? []).map(toChangeRow),
		isManualChange: entry.isManualChange === true,
	})),
})

const gameGroup = (
	id: number,
	name: string,
	noRepeat: boolean,
	games: [name: string, description: string][],
): AdminWheelGroup => ({
	id,
	name,
	kind: 'games',
	system: false,
	noRepeat,
	entries: games.map(([gameName, description], i) => ({
		id: id * 10 + i,
		name: gameName,
		description,
		changes: [],
		entries: [],
		isManualChange: false,
	})),
})

export const wheelGroups: AdminWheelGroup[] = [
	...db.wheelGroups.map(changeGroup),
	{
		id: 100,
		name: 'Вишлист',
		kind: 'games',
		system: true,
		noRepeat: false,
		entries: [],
	},
	gameGroup(101, 'Короткие', true, [
		['Inside', 'Около 4 часов, проходится за вечер.'],
		['Firewatch', 'Около 5 часов, почти без сложных мест.'],
		['Gris', 'Около 4 часов, без смертей.'],
		['Journey', 'Пара часов, лучше за один присест.'],
	]),
	gameGroup(102, 'Кооп', false, [
		['Portal 2', 'Отдельная кампания на двоих.'],
		['It Takes Two', 'Только вдвоём, по сети или на одном экране.'],
		['Unravel Two', 'Спокойный платформер на двоих.'],
	]),
	gameGroup(103, 'Хорроры', true, [
		['Signalis', 'Сурвайвл-хоррор в духе старых Silent Hill.'],
		['SOMA', 'Больше про историю, чем про скримеры.'],
		['Inscryption', 'Карточная игра, которая быстро становится чем-то другим.'],
	]),
]

// ---- rewards

export const rewards: Rewards = {
	timer: [
		{ kind: 'points', targetId: db.pointRef('Золото', 0).id, amount: '+50' },
		{ kind: 'points', targetId: db.pointRef('Репутация', 0).id, amount: '+2' },
		{ kind: 'item', targetId: db.itemCatalog['Билет на колесо'].id, amount: '+1' },
	],
	game: [
		{ kind: 'points', targetId: db.pointRef('Золото', 0).id, amount: '+200' },
		{ kind: 'points', targetId: db.pointRef('Репутация', 0).id, amount: '+10' },
		{ kind: 'item', targetId: db.itemCatalog['Билет на колесо'].id, amount: '+1' },
	],
}

// ---- members and parameters

const member = (
	login: string,
	displayName: string | null,
	joinedDate: string,
	isAdmin: boolean,
): PartyMember => ({ login, displayName, joinedDate: `${joinedDate}T12:00:00Z`, isAdmin })

export const members: PartyMember[] = [
	member('kirill', 'Кирилл', '2026-09-01', true),
	member('anna', 'Аня', '2026-09-01', true),
	member('sasha', null, '2026-09-03', false),
	member('max', 'Макс', '2026-09-05', false),
	member('lena', 'Лена', '2026-09-12', false),
	member('oleg', null, '2026-09-20', false),
]

export const params: SystemParam[] = [
	{
		key: 'wishlist.minGames',
		title: 'Мин. игр в вишлисте',
		hint: 'меньше — колесо по вишлисту не крутится',
		value: '5',
		default: '3',
		unit: 'игр',
	},
	{
		key: 'timer.duration',
		title: 'Длительность таймера',
		hint: 'после неё выдаётся награда таймера',
		value: '2:00:00',
		default: '2:00:00',
		unit: 'ч:м:с',
	},
	{
		key: 'wheel.minEffects',
		title: 'Мин. эффектов для прокрута',
		hint: 'меньше доступных — колесо эффектов не крутится',
		value: '4',
		default: '4',
		unit: 'шт.',
	},
]
