import type {
	CompletedGame,
	Effect,
	ISODate,
	ItemStack,
	JournalEntry,
	Login,
	Perk,
	PlayerRef,
	PlayerResources,
	PlayerStatus,
	PointType,
	ResourceRef,
	Seconds,
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

export const players: PlayerRef[] = [
	'kirill',
	'anna',
	'max',
	'lena',
	'sasha',
	'oleg',
].map((login, i) => ({ login, colorIndex: i + 1 }))

export const pointTypes: PointType[] = [
	{ name: 'Золото', unitForms: ['золото', 'золота', 'золота'] },
	{ name: 'Репутация', unitForms: ['репутация', 'репутации', 'репутации'] },
	{ name: 'Билеты', unitForms: ['билет', 'билета', 'билетов'] },
	{ name: 'Осколки', unitForms: ['осколок', 'осколка', 'осколков'] },
	{ name: 'Опыт', unitForms: ['опыт', 'опыта', 'опыта'] },
	{ name: 'Карма', unitForms: ['карма', 'кармы', 'кармы'] },
]

type ItemDef = { description: string; usesMax: number; needsTarget?: boolean }

export const itemCatalog: Record<string, ItemDef> = {
	Колобок: {
		description: 'монетка: +3 очка или Колобок укатывается к другому игроку',
		usesMax: 1,
	},
	'Свиток удачи': { description: '+50 золота', usesMax: 1 },
	'Билет на колесо': { description: '+1 прокрут колеса', usesMax: 1 },
	Щит: { description: 'эффект «Щит» на 1 день', usesMax: 3 },
	Проклятие: {
		description: '−30 золота цели',
		usesMax: 2,
		needsTarget: true,
	},
	'Кубик реролла': { description: '+1 перекрут колеса', usesMax: 1 },
	'Свиток пропуска': {
		description: 'снимает текущую игру без штрафа',
		usesMax: 1,
	},
}

export const perkCatalog: Record<string, Omit<Perk, 'name'>> = {
	Везунчик: {
		effect: {
			name: 'Бесплатный перекрут',
			text: '+1 перекрут колеса в неделю.',
		},
		kind: 'active',
		usesLeft: 1,
		usesMax: 1,
	},
	Марафонец: {
		effect: {
			name: 'Второе дыхание',
			text: '+10% золота за таймер дольше 3 ч, а за таймер дольше 5 ч ещё +1 билет на колесо.',
		},
		kind: 'passive',
	},
	Коллекционер: {
		effect: {
			name: 'Трофей',
			text: '+1 случайный предмет за каждую пройденную игру.',
		},
		kind: 'passive',
	},
}

export const makeItem = (
	name: string,
	held: number,
	usesLeft?: number,
): ItemStack => {
	const def = itemCatalog[name]

	return {
		name,
		description: def.description,
		held,
		usesLeft: usesLeft ?? def.usesMax,
		usesMax: def.usesMax,
		needsTarget: !!def.needsTarget,
	}
}

export const makePerk = (name: string, usesLeft?: number): Perk => {
	const def = perkCatalog[name]

	return {
		name,
		...def,
		...(def.kind === 'active' && { usesLeft: usesLeft ?? def.usesMax }),
	}
}

const ref = (login: Login) => players.find((p) => p.login === login)!

const points = (
	gold: number,
	rep: number,
	tickets: number,
	shards: number,
	xp: number,
	karma: number,
) => ({
	Золото: gold,
	Репутация: rep,
	Билеты: tickets,
	Осколки: shards,
	Опыт: xp,
	Карма: karma,
})

const effect = (
	name: string,
	description: string,
	source: string,
	expiresIn: number | null,
	uses?: [left: number, max: number],
): Effect => ({
	name,
	description,
	source,
	expiresAt: expiresIn === null ? null : fromNow(expiresIn),
	...(uses && { usesLeft: uses[0], usesMax: uses[1] }),
})

export const resources: Record<Login, PlayerResources> = {
	kirill: {
		player: ref('kirill'),
		points: points(340, 12, 3, 27, 1180, -4),
		items: [
			makeItem('Свиток удачи', 6),
			makeItem('Билет на колесо', 11),
			makeItem('Щит', 3, 2),
			makeItem('Проклятие', 2, 1),
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
		player: ref('anna'),
		points: points(520, 18, 5, 41, 1640, 6),
		items: [
			makeItem('Колобок', 1),
			makeItem('Свиток удачи', 4),
			makeItem('Щит', 2, 2),
			makeItem('Кубик реролла', 1),
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
		player: ref('max'),
		points: points(290, 9, 2, 12, 990, 0),
		items: [
			makeItem('Билет на колесо', 4),
			makeItem('Щит', 1),
			makeItem('Кубик реролла', 2),
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
		player: ref('lena'),
		points: points(210, 15, 4, 30, 870, 3),
		items: [makeItem('Свиток удачи', 2), makeItem('Свиток пропуска', 1)],
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
		player: ref('sasha'),
		points: points(180, 7, 1, 8, 610, -2),
		items: [makeItem('Колобок', 1), makeItem('Билет на колесо', 2)],
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
		player: ref('oleg'),
		points: points(95, 4, 0, 3, 240, 1),
		items: [makeItem('Билет на колесо', 1)],
		perks: [],
		effects: [],
	},
}

const wish = (id: string, name: string, addedAt: ISODate): WishlistGame => ({
	id,
	name,
	addedAt,
})

export const wishlists: Record<Login, WishlistGame[]> = {
	kirill: [
		wish('w1', 'Celeste', '2026-09-05T12:00:00Z'),
		wish('w2', 'Hades', '2026-09-11T12:00:00Z'),
		wish('w3', 'Outer Wilds', '2026-09-20T12:00:00Z'),
		wish('w4', 'Inside', '2026-10-01T12:00:00Z'),
		wish('w5', 'Stardew Valley', '2026-10-04T12:00:00Z'),
	],
	anna: [
		wish('w6', 'Celeste', '2026-09-01T12:00:00Z'),
		wish('w7', 'Hollow Knight: Silksong', '2026-09-03T12:00:00Z'),
		wish('w8', 'Ori and the Will of the Wisps', '2026-09-12T12:00:00Z'),
		wish('w9', 'Tunic', '2026-09-30T12:00:00Z'),
	],
	max: [
		wish('w10', 'Signalis', '2026-09-15T12:00:00Z'),
		wish('w11', 'Hades II', '2026-09-22T12:00:00Z'),
	],
	lena: [
		wish('w12', 'Pentiment', '2026-09-02T12:00:00Z'),
		wish('w13', 'Outer Wilds', '2026-09-19T12:00:00Z'),
		wish('w14', 'Return of the Obra Dinn', '2026-10-05T12:00:00Z'),
	],
	sasha: [],
	oleg: [],
}

const done = (
	id: string,
	name: string,
	startedAt: string,
	endedAt: string,
	hours: number,
	minutes: number,
	status: CompletedGame['status'],
	rating: number | null = null,
	review: string | null = null,
): CompletedGame => ({
	id,
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
			'c1',
			'Disco Elysium',
			'2026-09-12',
			'2026-10-07',
			31,
			20,
			'completed',
			9,
			'Лучшие диалоги, что я читал в играх. Провалил половину проверок и ни о чём не жалею.',
		),
		done('c2', 'Inside', '2026-09-24', '2026-09-28', 4, 5, 'completed'),
		done('c3', 'Dead Cells', '2026-09-15', '2026-09-19', 6, 40, 'cancelled'),
		done('c4', 'Control', '2026-09-09', '2026-09-10', 1, 15, 'rerolled'),
		done(
			'c5',
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
			'c6',
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
			'c7',
			'Hades',
			'2026-09-01',
			'2026-09-18',
			27,
			10,
			'completed',
			8,
			'Затягивает с первого забега. Под конец гринд немного утомил.',
		),
		done('c8', 'Cuphead', '2026-08-28', '2026-08-31', 3, 20, 'cancelled'),
		done(
			'c9',
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
			'c10',
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
		done('c11', 'Inscryption', '2026-09-14', '2026-09-29', 12, 40, 'completed'),
		done('c12', 'Control', '2026-09-05', '2026-09-08', 2, 10, 'rerolled'),
	],
	sasha: [],
	oleg: [],
}

const entry = (
	id: string,
	at: ISODate,
	actor: JournalEntry['actor'],
	kind: JournalEntry['source']['kind'],
	label: string,
	manual: boolean,
	changes: JournalEntry['changes'],
): JournalEntry => ({
	id,
	at,
	actor,
	source: { kind, label },
	manual,
	changes,
})

export const journal: JournalEntry[] = [
	entry('j1', ago(12 * MIN), 'anna', 'item', 'предмет «Колобок»', true, [
		{
			player: 'anna',
			text: '−1 Колобок',
			resource: { kind: 'item', name: 'Колобок', amount: -1 },
		},
		{
			player: 'sasha',
			text: '+1 Колобок',
			resource: { kind: 'item', name: 'Колобок', amount: 1 },
		},
	]),
	entry(
		'j2',
		ago(30 * MIN),
		'kirill',
		'item',
		'предмет «Кубическая дуэль»',
		true,
		[
			{ player: 'kirill', text: '+3 очка' },
			{ player: 'kirill', text: '+1 Реролл игры' },
		],
	),
	entry(
		'j3',
		ago(2 * HOUR),
		'kirill',
		'exchange',
		'обмен «Набор для рерола»',
		false,
		[
			{
				player: 'kirill',
				text: '−80 золота',
				resource: { kind: 'points', type: 'Золото', amount: -80 },
			},
			{
				player: 'kirill',
				text: '−2 репутации',
				resource: { kind: 'points', type: 'Репутация', amount: -2 },
			},
			{
				player: 'kirill',
				text: '+1 Свиток пропуска',
				resource: { kind: 'item', name: 'Свиток пропуска', amount: 1 },
			},
		],
	),
	entry('j4', ago(3 * HOUR), 'anna', 'item', 'предмет «Проклятие»', false, [
		{
			player: 'kirill',
			text: 'эффект Проклятие · 3 ч',
			resource: { kind: 'effect', name: 'Проклятие' },
		},
	]),
	entry('j5', ago(5 * HOUR), 'max', 'wheel', 'колесо · «×2 золото»', false, [
		{
			player: 'max',
			text: 'эффект ×2 золото · 2 ч',
			resource: { kind: 'effect', name: '×2 золото' },
		},
	]),
	entry(
		'j6',
		ago(DAY + 2 * HOUR),
		'lena',
		'timer',
		'таймер · Disco Elysium',
		false,
		[
			{
				player: 'lena',
				text: '+50 золота',
				resource: { kind: 'points', type: 'Золото', amount: 50 },
			},
		],
	),
	entry('j7', ago(DAY + 6 * HOUR), 'admin', 'grant', 'грант', false, [
		{
			player: 'all',
			text: '+100 золота',
			resource: { kind: 'points', type: 'Золото', amount: 100 },
		},
	]),
]

/** extra history of resource changes that are older than the journal */
export const resourceHistory: Record<
	string,
	{ at: ISODate; source: string; delta: string }[]
> = {
	'kirill|Щит': [
		{ at: ago(6 * DAY), source: 'колесо', delta: '+1' },
		{ at: ago(9 * DAY), source: 'грант админа', delta: '+3' },
	],
	'kirill|Свиток удачи': [
		{ at: ago(DAY), source: 'таймер', delta: '+1' },
		{ at: ago(8 * DAY), source: 'колесо', delta: '+2' },
	],
	'anna|Щит': [
		{ at: ago(7 * DAY), source: 'обмен «Разобрать щиты»', delta: '−2' },
	],
}

export const wheelGroups: WheelGroup[] = [
	{
		id: 'bonuses',
		name: 'Бонусы',
		entries: [
			{ id: 'b1', name: '+50 золота', description: 'Начисляется 50 золота.' },
			{
				id: 'b2',
				name: '×2 золото',
				description: 'Два часа таймер даёт двойное золото.',
			},
			{ id: 'b3', name: 'Бесплатный перекрут' },
			{ id: 'b4', name: '+1 билет' },
			{
				id: 'b5',
				name: 'Щит на день',
				description: 'Сутки на тебя не действуют проклятия.',
			},
			{ id: 'b6', name: '+5 репутации' },
		],
	},
	{
		id: 'penalties',
		name: 'Штрафы',
		entries: [
			{
				id: 'p1',
				name: 'Пропуск таймера',
				description: 'Следующий таймер без награды.',
			},
			{
				id: 'p2',
				name: 'Проклятие на день',
				description: 'Сутки все награды на 25% меньше.',
			},
			{
				id: 'p3',
				name: '−1 билет',
				description: 'Списывается один билет на колесо.',
			},
			{ id: 'p4', name: '−20 золота', description: 'Списывается 20 золота.' },
			{ id: 'p5', name: '−50% награды таймера' },
			{ id: 'p6', name: 'Минус предмет' },
			{ id: 'p7', name: 'Отдать 30 золота лидеру' },
		],
	},
	{
		id: 'items',
		name: 'Предметы',
		entries: [
			{ id: 'i1', name: 'Свиток удачи' },
			{ id: 'i2', name: 'Щит' },
			{ id: 'i3', name: 'Колобок' },
			{ id: 'i4', name: 'Кубическая дуэль' },
			{ id: 'i5', name: 'Свиток пропуска' },
		],
	},
	{
		id: 'perks',
		name: 'Перки',
		entries: [
			{ id: 'k1', name: 'Везунчик' },
			{ id: 'k2', name: 'Марафонец' },
			{ id: 'k3', name: 'Коллекционер' },
			{ id: 'k4', name: 'Щедрый' },
		],
	},
	{
		id: 'chaos',
		name: 'Хаос',
		entries: [
			{ id: 'x1', name: 'Обмен вишлистами' },
			{ id: 'x2', name: 'Все меняются местами' },
			{ id: 'x3', name: 'Случайный игрок получает 50 золота' },
			{ id: 'x4', name: 'Таймер ×2 на час' },
			{ id: 'x5', name: 'Отдать предмет соседу' },
		],
	},
]

export type ExchangeDef = {
	id: string
	name: string
	description: string
	give: ResourceRef[]
	get: ResourceRef[]
}

export const exchangeDefs: ExchangeDef[] = [
	{
		id: 'reroll-kit',
		name: 'Набор для рерола',
		description:
			'Пригодится, если колесо выдало неудачную игру. Свиток снимает текущую игру без штрафа, кубик даёт перекрут.',
		give: [
			{ kind: 'points', type: 'Золото', amount: 80 },
			{ kind: 'points', type: 'Репутация', amount: 2 },
		],
		get: [
			{ kind: 'item', name: 'Свиток пропуска', amount: 1 },
			{ kind: 'item', name: 'Кубик реролла', amount: 1 },
		],
	},
	{
		id: 'perk-collector',
		name: 'Перк «Коллекционер»',
		description:
			'Постоянный перк: +1 случайный предмет за каждую пройденную игру. Покупается один раз за сезон.',
		give: [
			{ kind: 'points', type: 'Билеты', amount: 3 },
			{ kind: 'item', name: 'Свиток удачи', amount: 1 },
			{ kind: 'points', type: 'Осколки', amount: 40 },
		],
		get: [{ kind: 'perk', name: 'Коллекционер' }],
	},
	{
		id: 'shields-to-gold',
		name: 'Разобрать щиты',
		description: 'Лишние щиты можно превратить в золото и осколки.',
		give: [{ kind: 'item', name: 'Щит', amount: 2 }],
		get: [
			{ kind: 'points', type: 'Золото', amount: 60 },
			{ kind: 'points', type: 'Осколки', amount: 10 },
			{ kind: 'points', type: 'Билеты', amount: 1 },
		],
	},
]

export type MemberSeed = {
	status: PlayerStatus
	currentGame: string | null
	timer: { state: TimerState; elapsed: Seconds }
	playedHours: number
	completedCount: number
	spinsCount: number
}

export const memberSeeds: Record<Login, MemberSeed> = {
	anna: {
		status: 'playing',
		currentGame: 'Celeste',
		timer: { state: 'running', elapsed: 12 * 60 },
		playedHours: 214,
		completedCount: 23,
		spinsCount: 31,
	},
	max: {
		status: 'paused',
		currentGame: 'Hades',
		timer: { state: 'paused', elapsed: 0 },
		playedHours: 131,
		completedCount: 14,
		spinsCount: 19,
	},
	lena: {
		status: 'dropped',
		currentGame: 'Disco Elysium',
		timer: { state: 'idle', elapsed: 0 },
		playedHours: 97,
		completedCount: 9,
		spinsCount: 15,
	},
	oleg: {
		status: 'rolling',
		currentGame: null,
		timer: { state: 'idle', elapsed: 0 },
		playedHours: 42,
		completedCount: 4,
		spinsCount: 8,
	},
	sasha: {
		status: 'playing',
		currentGame: 'Outer Wilds',
		timer: { state: 'running', elapsed: 40 * 60 },
		playedHours: 76,
		completedCount: 8,
		spinsCount: 11,
	},
}

export const MY_PLAYED_HOURS = 168
export const MY_COMPLETED_BEFORE_SEASON = 14
export const MY_SPINS = 22

export const TIMER_GOAL: Seconds = 7200

export const state = {
	currentGame: {
		game: { id: 'g1', name: 'Heroes of Might and Magic: Olden Era' } as {
			id: string
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
	spins: new Map<string, WheelSpinResult>(),
}
