import type {
	CompletedGame,
	Effect,
	ISODate,
	JournalEntry,
	JournalSource,
	Login,
	Perk,
	UserRef,
	UserItem,
	UserResources,
	UserStatus,
	PointType,
	ResourceRef,
	Seconds,
	SpinCostRef,
	TimerState,
	WheelGroup,
	WheelSpinResult,
	WishlistGame,
} from '../contracts'

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

const ago = (ms: number): ISODate => new Date(Date.now() - ms).toISOString()
const fromNow = (ms: number): ISODate => new Date(Date.now() + ms).toISOString()

export const ME: Login = 'kirill'

export const users: UserRef[] = [
	'kirill',
	'anna',
	'max',
	'lena',
	'sasha',
	'oleg',
].map((login, i) => ({ login, colorIndex: i + 1 }))

const pointType = (
	id: number,
	name: string,
	description: string,
	unitForms: PointType['unitForms'],
	rest: Partial<PointType> = {},
): PointType => ({
	id,
	name,
	description,
	unitForms,
	startValue: 0,
	isPublic: true,
	isShared: false,
	minimum: null,
	maximum: null,
	...rest,
})

export const pointTypes: PointType[] = [
	pointType(
		1,
		'Золото',
		'Основная валюта: идёт за таймер и прохождения, тратится в обменах.',
		['золото', 'золота', 'золота'],
		{ startValue: 100, minimum: 0 },
	),
	pointType(
		2,
		'Репутация',
		'Растёт за пройденные игры и отзывы. Нужна для редких обменов.',
		['репутация', 'репутации', 'репутации'],
		{ minimum: 0, maximum: 100 },
	),
	pointType(
		3,
		'Билеты',
		'Один билет — один прокрут колеса сверх обычных.',
		['билет', 'билета', 'билетов'],
		{ startValue: 1, minimum: 0 },
	),
	pointType(
		4,
		'Осколки',
		'Остаются, когда разбираешь предметы. Копятся на перки.',
		['осколок', 'осколка', 'осколков'],
		{ minimum: 0 },
	),
	pointType(
		5,
		'Опыт',
		'Показывает, сколько ты наиграл(а) за сезон. Ни на что не тратится.',
		['опыт', 'опыта', 'опыта'],
	),
	pointType(
		6,
		'Карма',
		'Плюс за помощь другим, минус за проклятия. Может уйти в минус.',
		['карма', 'кармы', 'кармы'],
		{ minimum: -20 },
	),
	pointType(
		7,
		'Казна',
		'Общие очки пати: копятся у всех вместе и тратятся на общие цели.',
		['очко казны', 'очка казны', 'очков казны'],
		{ isShared: true, minimum: 0, maximum: 1000 },
	),
	pointType(
		8,
		'Скрытый рейтинг',
		'Служебные очки: их видят только админы пати.',
		['очко рейтинга', 'очка рейтинга', 'очков рейтинга'],
		{ isPublic: false },
	),
]

/** values of the shared point types by the id of the type */
export const sharedPoints: Record<number, number> = { 7: 240 }

type ItemDef = { id: number; description: string; usesMax: number }

export const itemCatalog: Record<string, ItemDef> = {
	Колобок: {
		id: 1,
		description: 'монетка: +3 очка или Колобок укатывается к другому игроку',
		usesMax: 1,
	},
	'Свиток удачи': { id: 2, description: '+50 золота', usesMax: 1 },
	'Билет на колесо': { id: 3, description: '+1 прокрут колеса', usesMax: 1 },
	Щит: { id: 4, description: 'эффект «Щит» на 1 день', usesMax: 3 },
	Проклятие: { id: 5, description: '−30 золота', usesMax: 2 },
	'Кубик реролла': { id: 6, description: '+1 перекрут колеса', usesMax: 1 },
	'Свиток пропуска': {
		id: 7,
		description: 'снимает текущую игру без штрафа',
		usesMax: 1,
	},
}

export const perkCatalog: Record<string, Omit<Perk, 'name'>> = {
	Везунчик: {
		id: 1,
		effect: {
			name: 'Бесплатный перекрут',
			text: '+1 перекрут колеса.',
		},
		kind: 'active',
		usesLeft: 1,
		usesMax: 1,
	},
	Марафонец: {
		id: 2,
		effect: {
			name: 'Второе дыхание',
			text: '+10% золота за таймер дольше 3 ч, а за таймер дольше 5 ч ещё +1 билет на колесо.',
		},
		kind: 'passive',
	},
	Коллекционер: {
		id: 3,
		effect: {
			name: 'Трофей',
			text: '+1 случайный предмет за каждую пройденную игру.',
		},
		kind: 'passive',
	},
}

let nextUserItemId = 1

export const newUserItemId = () => nextUserItemId++

/** `count` separate copies of the item, each with its own uses */
export const makeItems = (name: string, count: number, usesLeft?: number): UserItem[] => {
	const def = itemCatalog[name]

	return Array.from({ length: count }, () => ({
		id: newUserItemId(),
		itemId: def.id,
		name,
		description: def.description,
		usesLeft: usesLeft ?? def.usesMax,
		usesMax: def.usesMax,
	}))
}

export const makePerk = (name: string, usesLeft?: number): Perk => {
	const def = perkCatalog[name]

	return {
		name,
		...def,
		...(def.kind === 'active' && { usesLeft: usesLeft ?? def.usesMax }),
	}
}

const effectIds: Record<string, number> = {}

const effectId = (name: string) =>
	(effectIds[name] ??= Object.keys(effectIds).length + 1)

export const pointRef = (name: string, amount: number): ResourceRef => ({
	kind: 'points',
	id: pointTypes.find((t) => t.name === name)!.id,
	name,
	amount,
})

export const itemRef = (name: string, amount: number): ResourceRef => ({
	kind: 'item',
	id: itemCatalog[name].id,
	name,
	amount,
})

export const perkRef = (name: string): ResourceRef => ({
	kind: 'perk',
	id: perkCatalog[name].id,
	name,
})

export const effectRef = (name: string): ResourceRef => ({
	kind: 'effect',
	id: effectId(name),
	name,
})

const ref = (login: Login) => users.find((p) => p.login === login)!

const points = (
	gold: number,
	rep: number,
	tickets: number,
	shards: number,
	xp: number,
	karma: number,
): Record<number, number> => ({
	1: gold,
	2: rep,
	3: tickets,
	4: shards,
	5: xp,
	6: karma,
	8: Math.round(xp / 100),
})

const effect = (
	name: string,
	description: string,
	source: string,
	expiresIn: number | null,
	uses?: [left: number, max: number],
): Effect => ({
	id: effectId(name),
	name,
	description,
	source,
	expiresAt: expiresIn === null ? null : fromNow(expiresIn),
	...(uses && { usesLeft: uses[0], usesMax: uses[1] }),
})

export const resources: Record<Login, UserResources> = {
	kirill: {
		user: ref('kirill'),
		points: points(340, 12, 3, 27, 1180, -4),
		items: [
			...makeItems('Свиток удачи', 6),
			...makeItems('Билет на колесо', 11),
			...makeItems('Щит', 3, 2),
			...makeItems('Проклятие', 2, 1),
		],
		perks: [makePerk('Везунчик'), makePerk('Марафонец')],
		effects: [
			effect(
				'×2 золото',
				'Двойное золото за таймер.',
				'предмет «Свиток удачи» · ты',
				HOUR + 40 * MIN,
			),
			effect(
				'Щит',
				'Блокирует негативные предметы.',
				'предмет «Щит» · ты',
				22 * HOUR,
				[1, 2],
			),
			effect(
				'Проклятие',
				'−10% золота за таймер.',
				'предмет «Проклятие» · от anna',
				3 * HOUR,
			),
			effect(
				'Знак дуэлянта',
				'+1 к броску в «Кубической дуэли».',
				'колесо · Бонусы',
				null,
			),
			effect(
				'Заморозка',
				'Ставит таймер на паузу без потери прогресса.',
				'предмет «Зелье времени» · ты',
				null,
				[2, 3],
			),
		],
	},
	anna: {
		user: ref('anna'),
		points: points(520, 18, 5, 41, 1640, 6),
		items: [
			...makeItems('Колобок', 1),
			...makeItems('Свиток удачи', 4),
			...makeItems('Щит', 2, 2),
			...makeItems('Кубик реролла', 1),
		],
		perks: [makePerk('Везунчик', 0)],
		effects: [
			effect(
				'×2 золото',
				'Двойное золото за таймер.',
				'колесо · anna',
				4 * HOUR,
			),
		],
	},
	max: {
		user: ref('max'),
		points: points(290, 9, 2, 12, 990, 0),
		items: [
			...makeItems('Билет на колесо', 4),
			...makeItems('Щит', 1),
			...makeItems('Кубик реролла', 2),
		],
		perks: [makePerk('Марафонец')],
		effects: [
			effect(
				'×2 золото',
				'Двойное золото за таймер.',
				'колесо · max',
				2 * HOUR,
			),
		],
	},
	lena: {
		user: ref('lena'),
		points: points(210, 15, 4, 30, 870, 3),
		items: [...makeItems('Свиток удачи', 2), ...makeItems('Свиток пропуска', 1)],
		perks: [],
		effects: [
			effect(
				'Проклятие',
				'−10% золота за таймер.',
				'предмет «Проклятие» · от anna',
				26 * HOUR,
			),
		],
	},
	sasha: {
		user: ref('sasha'),
		points: points(180, 7, 1, 8, 610, -2),
		items: [...makeItems('Колобок', 1), ...makeItems('Билет на колесо', 2)],
		perks: [],
		effects: [
			effect(
				'−10% очков',
				'Все начисления очков на 10% меньше.',
				'колесо · sasha',
				6 * HOUR,
			),
		],
	},
	oleg: {
		user: ref('oleg'),
		points: points(95, 4, 0, 3, 240, 1),
		items: [...makeItems('Билет на колесо', 1)],
		perks: [],
		effects: [],
	},
}

const gameIds = new Map<string, number>()

/** the party game is shared by all users, so the id depends on the name only */
export const gameId = (name: string): number => {
	const key = name.toLowerCase()

	if (!gameIds.has(key)) gameIds.set(key, gameIds.size + 1)

	return gameIds.get(key)!
}

const wish = (id: number, name: string, addedAt: ISODate): WishlistGame => ({
	id,
	name,
	addedAt,
})

export const wishlists: Record<Login, WishlistGame[]> = {
	kirill: [
		wish(1, 'Celeste', '2026-09-05T12:00:00Z'),
		wish(2, 'Hades', '2026-09-11T12:00:00Z'),
		wish(3, 'Outer Wilds', '2026-09-20T12:00:00Z'),
		wish(4, 'Hollow Knight', '2026-10-01T12:00:00Z'),
		wish(5, 'Stardew Valley', '2026-10-04T12:00:00Z'),
	],
	anna: [
		wish(6, 'Sea of Stars', '2026-09-01T12:00:00Z'),
		wish(7, 'Hollow Knight: Silksong', '2026-09-03T12:00:00Z'),
		wish(8, 'Ori and the Will of the Wisps', '2026-09-12T12:00:00Z'),
		wish(9, 'Tunic', '2026-09-30T12:00:00Z'),
	],
	max: [
		wish(10, 'Signalis', '2026-09-15T12:00:00Z'),
		wish(11, 'Hades II', '2026-09-22T12:00:00Z'),
	],
	lena: [
		wish(12, 'Pentiment', '2026-09-02T12:00:00Z'),
		wish(13, 'Outer Wilds', '2026-09-19T12:00:00Z'),
		wish(14, 'Return of the Obra Dinn', '2026-10-05T12:00:00Z'),
	],
	sasha: [],
	oleg: [],
}

const done = (
	name: string,
	startedAt: string,
	endedAt: string,
	hours: number,
	minutes: number,
	status: CompletedGame['status'],
	rating: number | null = null,
	review: string | null = null,
): CompletedGame => ({
	gameId: gameId(name),
	name,
	startedAt: `${startedAt}T12:00:00Z`,
	endedAt: `${endedAt}T12:00:00Z`,
	playedSeconds: hours * 3600 + minutes * 60,
	status,
	rating,
	review,
})

export const completed: Record<Login, CompletedGame[]> = {
	kirill: [
		done(
			'Disco Elysium',
			'2026-09-12',
			'2026-10-07',
			31,
			20,
			'completed',
			9,
			'Лучшие диалоги, что я читал в играх. Провалил половину проверок и ни о чём не жалею.',
		),
		done('Inside', '2026-09-24', '2026-09-28', 4, 5, 'completed'),
		done('Dead Cells', '2026-09-15', '2026-09-19', 6, 40, 'cancelled'),
		done('Control', '2026-09-09', '2026-09-10', 1, 15, 'rerolled'),
		done(
			'Portal 2',
			'2026-08-25',
			'2026-09-02',
			9,
			50,
			'completed',
			8,
			'Кооп с Аней — отдельное удовольствие. Финал до сих пор вспоминаю.',
		),
	],
	anna: [
		done(
			'Celeste',
			'2026-09-20',
			'2026-10-06',
			14,
			30,
			'completed',
			10,
			'Сложно, честно и очень тепло. Б-стороны добила на одном упрямстве.',
		),
		done(
			'Hades',
			'2026-09-01',
			'2026-09-18',
			27,
			10,
			'completed',
			8,
			'Затягивает с первого забега. Под конец гринд немного утомил.',
		),
		done('Cuphead', '2026-08-28', '2026-08-31', 3, 20, 'cancelled'),
		done(
			'Firewatch',
			'2026-08-20',
			'2026-08-23',
			4,
			45,
			'completed',
			7,
			'Красиво и атмосферно, но концовка оборвалась.',
		),
	],
	max: [
		done(
			'Undertale',
			'2026-09-10',
			'2026-09-18',
			7,
			15,
			'completed',
			9,
			'Пацифист с первого раза. Музыка — отдельная любовь.',
		),
	],
	lena: [
		done('Inscryption', '2026-09-14', '2026-09-29', 12, 40, 'completed'),
		done('Control', '2026-09-05', '2026-09-08', 2, 10, 'rerolled'),
	],
	sasha: [],
	oleg: [],
}

const entry = (
	id: number,
	at: ISODate,
	actor: JournalEntry['actor'],
	source: JournalSource,
	manual: boolean,
	changes: JournalEntry['changes'],
): JournalEntry => ({
	id,
	at,
	actor,
	source,
	manual,
	changes,
})

const itemSource = (name: string): JournalSource => ({
	type: 'item',
	id: itemCatalog[name]?.id,
	name,
})

export const journal: JournalEntry[] = [
	entry(1, ago(12 * MIN), 'anna', itemSource('Колобок'), true, [
		{
			login: 'anna',
			text: '−1 Колобок',
			resource: itemRef('Колобок', -1),
		},
		{
			login: 'sasha',
			text: '+1 Колобок',
			resource: itemRef('Колобок', 1),
		},
	]),
	entry(
		2,
		ago(30 * MIN),
		'kirill',
		itemSource('Кубическая дуэль'),
		true,
		[
			{ login: 'kirill', text: '+3 очка' },
			{ login: 'kirill', text: '+1 Реролл игры' },
		],
	),
	entry(
		3,
		ago(2 * HOUR),
		'kirill',
		{ type: 'exchange', id: 1, name: 'Набор для рерола' },
		false,
		[
			{
				login: 'kirill',
				text: '−80 золота',
				resource: pointRef('Золото', -80),
			},
			{
				login: 'kirill',
				text: '−2 репутации',
				resource: pointRef('Репутация', -2),
			},
			{
				login: 'kirill',
				text: '+1 Свиток пропуска',
				resource: itemRef('Свиток пропуска', 1),
			},
		],
	),
	entry(4, ago(3 * HOUR), 'anna', itemSource('Проклятие'), false, [
		{
			login: 'kirill',
			text: 'эффект Проклятие · 3 ч',
			resource: effectRef('Проклятие'),
		},
	]),
	entry(5, ago(5 * HOUR), 'max', { type: 'wheel_row', id: 12, name: '×2 золото' }, false, [
		{
			login: 'max',
			text: 'эффект ×2 золото · 2 ч',
			resource: effectRef('×2 золото'),
		},
	]),
	entry(
		6,
		ago(DAY + 2 * HOUR),
		'lena',
		{ type: 'timer', name: 'Disco Elysium' },
		false,
		[
			{
				login: 'lena',
				text: '+50 золота',
				resource: pointRef('Золото', 50),
			},
		],
	),
	entry(7, ago(DAY + 6 * HOUR), 'anna', { type: 'manual' }, true, [
		{
			login: 'kirill',
			text: '+100 золота',
			resource: pointRef('Золото', 100),
		},
		{
			login: 'max',
			text: '+100 золота',
			resource: pointRef('Золото', 100),
		},
	]),
	entry(
		8,
		ago(3 * DAY),
		'kirill',
		{
			type: 'game',
			id: gameId('Heroes of Might and Magic: Olden Era'),
			name: 'Heroes of Might and Magic: Olden Era',
			event: 'started',
		},
		false,
		[],
	),
	entry(9, ago(40 * MIN), 'max', { type: 'manual' }, true, [
		{
			login: null,
			text: '+20 очков казны',
			resource: pointRef('Казна', 20),
		},
	]),
	entry(10, ago(4 * HOUR), 'anna', { type: 'manual' }, true, [
		{
			login: 'max',
			text: '+3 очка рейтинга',
			resource: pointRef('Скрытый рейтинг', 3),
		},
	]),
]

/** extra history of resource changes that are older than the journal, `login|kind|id` */
export const resourceHistory: Record<
	string,
	{ at: ISODate; source: string; delta: string }[]
> = {
	[`kirill|item|${itemCatalog['Щит'].id}`]: [
		{ at: ago(6 * DAY), source: 'колесо', delta: '+1' },
		{ at: ago(9 * DAY), source: 'грант админа', delta: '+3' },
	],
	[`kirill|item|${itemCatalog['Свиток удачи'].id}`]: [
		{ at: ago(DAY), source: 'таймер', delta: '+1' },
		{ at: ago(8 * DAY), source: 'колесо', delta: '+2' },
	],
	[`anna|item|${itemCatalog['Щит'].id}`]: [
		{ at: ago(7 * DAY), source: 'обмен «Разобрать щиты»', delta: '−2' },
	],
}

/**
 * Automatic entries are applied by the wheel itself, `isManualChange` entries
 * need the manual change form (effects, swaps, anything with a choice).
 */
export type WheelGroupDef = Omit<WheelGroup, 'cost'>

export const wheelGroups: WheelGroupDef[] = [
	{
		id: 1,
		name: 'Бонусы',
		kind: 'changes',
		entries: [
			{
				id: 11,
				name: '+50 золота',
				description: 'Начисляется 50 золота.',
				entries: [pointRef('Золото', 50)],
			},
			{
				id: 12,
				name: '×2 золото',
				description: 'Два часа таймер даёт двойное золото.',
				isManualChange: true,
			},
			{ id: 13, name: 'Бесплатный перекрут', isManualChange: true },
			{ id: 14, name: '+1 билет', entries: [pointRef('Билеты', 1)] },
			{
				id: 15,
				name: 'Щит на день',
				description: 'Сутки на тебя не действуют проклятия.',
				isManualChange: true,
			},
			{ id: 16, name: '+5 репутации', entries: [pointRef('Репутация', 5)] },
		],
	},
	{
		id: 2,
		name: 'Штрафы',
		kind: 'changes',
		entries: [
			{
				id: 21,
				name: 'Пропуск таймера',
				description: 'Следующий таймер без награды.',
				isManualChange: true,
			},
			{
				id: 22,
				name: 'Проклятие на день',
				description: 'Сутки все награды на 25% меньше.',
				isManualChange: true,
			},
			{
				id: 23,
				name: '−1 билет',
				description: 'Списывается один билет на колесо.',
				entries: [pointRef('Билеты', -1)],
			},
			{
				id: 24,
				name: '−20 золота',
				description: 'Списывается 20 золота.',
				entries: [pointRef('Золото', -20)],
			},
			{ id: 25, name: '−50% награды таймера', isManualChange: true },
			{ id: 26, name: 'Минус предмет', isManualChange: true },
			{ id: 27, name: 'Отдать 30 золота лидеру', isManualChange: true },
		],
	},
	{
		id: 3,
		name: 'Предметы',
		kind: 'changes',
		entries: [
			{ id: 31, name: 'Свиток удачи', entries: [itemRef('Свиток удачи', 1)] },
			{ id: 32, name: 'Щит', entries: [itemRef('Щит', 1)] },
			{ id: 33, name: 'Колобок', entries: [itemRef('Колобок', 1)] },
			{ id: 34, name: 'Кубическая дуэль', isManualChange: true },
			{
				id: 35,
				name: 'Свиток пропуска',
				entries: [itemRef('Свиток пропуска', 1)],
			},
		],
	},
	{
		id: 4,
		name: 'Перки',
		kind: 'changes',
		entries: [
			{ id: 41, name: 'Везунчик', entries: [perkRef('Везунчик')] },
			{ id: 42, name: 'Марафонец', entries: [perkRef('Марафонец')] },
			{ id: 43, name: 'Коллекционер', entries: [perkRef('Коллекционер')] },
			{ id: 44, name: 'Щедрый', isManualChange: true },
		],
	},
	{
		id: 5,
		name: 'Хаос',
		kind: 'changes',
		entries: [
			{ id: 51, name: 'Обмен вишлистами', isManualChange: true },
			{ id: 52, name: 'Все меняются местами', isManualChange: true },
			{
				id: 53,
				name: 'Случайный игрок получает 50 золота',
				isManualChange: true,
			},
			{ id: 54, name: 'Таймер ×2 на час', isManualChange: true },
			{ id: 55, name: 'Отдать предмет соседу', isManualChange: true },
		],
	},
]

export type ExchangeDef = {
	id: number
	name: string
	description: string
	give: ResourceRef[]
	get: ResourceRef[]
}

export const exchangeDefs: ExchangeDef[] = [
	{
		id: 1,
		name: 'Набор для рерола',
		description:
			'Пригодится, если колесо выдало неудачную игру. Свиток снимает текущую игру без штрафа, кубик даёт перекрут.',
		give: [pointRef('Золото', 80), pointRef('Репутация', 2)],
		get: [itemRef('Свиток пропуска', 1), itemRef('Кубик реролла', 1)],
	},
	{
		id: 2,
		name: 'Перк «Коллекционер»',
		description:
			'Постоянный перк: +1 случайный предмет за каждую пройденную игру. Покупается один раз за сезон.',
		give: [
			pointRef('Билеты', 3),
			itemRef('Свиток удачи', 1),
			pointRef('Осколки', 40),
		],
		get: [perkRef('Коллекционер')],
	},
	{
		id: 3,
		name: 'Разобрать щиты',
		description: 'Лишние щиты можно превратить в золото и осколки.',
		give: [itemRef('Щит', 2)],
		get: [
			pointRef('Золото', 60),
			pointRef('Осколки', 10),
			pointRef('Билеты', 1),
		],
	},
]

export type MemberSeed = {
	status: UserStatus
	currentGame: string | null
	playedHours: number
	completedCount: number
	spinsCount: number
}

export const memberSeeds: Record<Login, MemberSeed> = {
	anna: {
		status: 'playing',
		currentGame: 'Celeste',
		playedHours: 214,
		completedCount: 23,
		spinsCount: 31,
	},
	max: {
		status: 'paused',
		currentGame: 'Hades',
		playedHours: 131,
		completedCount: 14,
		spinsCount: 19,
	},
	lena: {
		status: 'offline',
		currentGame: 'Disco Elysium',
		playedHours: 97,
		completedCount: 9,
		spinsCount: 15,
	},
	oleg: {
		status: 'offline',
		currentGame: null,
		playedHours: 42,
		completedCount: 4,
		spinsCount: 8,
	},
	sasha: {
		status: 'playing',
		currentGame: 'Outer Wilds',
		playedHours: 76,
		completedCount: 8,
		spinsCount: 11,
	},
}

export const MY_PLAYED_HOURS = 168
export const MY_COMPLETED_BEFORE_SEASON = 14
export const MY_SPINS = 22

export const TIMER_GOAL: Seconds = 7200

/**
 * What an admin set for a spin of each group of changes (by the id of the
 * group), charged when the result is applied. A group without a cost is free.
 */
export const spinCosts: Record<number, SpinCostRef[]> = Object.fromEntries(
	wheelGroups
		.filter((g) => g.kind === 'changes')
		.map((g): [number, SpinCostRef[]] => [
			g.id,
			[{ kind: 'item', id: itemCatalog['Билет на колесо'].id, name: 'Билет на колесо', amount: 1 }],
		]),
)

export const state = {
	currentGame: {
		game: {
			id: gameId('Heroes of Might and Magic: Olden Era'),
			name: 'Heroes of Might and Magic: Olden Era',
		} as {
			id: number
			name: string
		} | null,
		playedSeconds: 6 * 3600,
		startedAt: ago(3 * DAY),
	},
	timer: {
		state: 'running' as TimerState,
		elapsed: 5077 as Seconds,
		stampedAt: Date.now(),
	},
	/** the spin that waits to be applied; a new spin replaces it */
	spin: null as WheelSpinResult | null,
	/** applied spins, their manual part is entered with the manual change form */
	appliedSpins: {} as Record<number, WheelSpinResult>,
	/** the party that the requests are made in */
	partyId: 1,
}
