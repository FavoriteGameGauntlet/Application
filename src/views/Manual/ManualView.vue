<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Login, ManualChange } from '../../api-facade/contracts'
import UserResourcesPanel from '../../components/UserResourcesPanel.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiIconButton from '../../components/ui/UiIconButton.vue'
import UiInput from '../../components/ui/UiInput.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import UiSelect from '../../components/ui/UiSelect.vue'
import { RouteName } from '../../router/routeNames'
import { useManualStore } from '../../stores/manualStore'
import { useMembersStore } from '../../stores/membersStore'
import { useResourcesStore } from '../../stores/resourcesStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useToastStore } from '../../stores/toastStore'
import { formatJournalSource, formatMoment, parseSpan } from '../../utils/format'
import { countItems } from '../../utils/userItems'

type RowType = ManualChange['kind']

type Row = {
	who: Login
	type: RowType
	/** id of the point type, item, perk or effect */
	resId: string
	/** plus / minus for points and items, grant / revoke for perks and effects */
	act: string
	/** the amount, the duration for an effect */
	n: string
}

const router = useRouter()
const manualStore = useManualStore()
const membersStore = useMembersStore()
const resourcesStore = useResourcesStore()
const sessionStore = useSessionStore()
const toastStore = useToastStore()

const draft = computed(() => manualStore.draft)

const parentLabel = computed(() => {
	switch (draft.value?.kind) {
		case 'fix':
			return 'История'
		case 'free':
			return 'Панель админа'
		default:
			return 'Колесо'
	}
})

const currentLabel = computed(() => {
	const current = draft.value

	if (current?.kind === 'fix') return 'Исправление'

	return current?.kind === 'wheel' ? current.name : 'Ручное изменение'
})

const note = computed(() =>
	draft.value?.kind === 'fix'
		? 'Исходная запись не меняется: исправление попадёт в журнал новой записью, и следующие события останутся корректными. Форма ничего не подставляет и не отменяет сама.'
		: '«Было → станет» считается по текущим ресурсам игрока. Все изменения попадут в журнал одной записью с меткой «вручную».',
)

const rows = ref<Row[]>([])
const panelUser = ref(sessionStore.login)

const typeOptions = [
	{ value: 'points', label: 'Очки' },
	{ value: 'shared-points', label: 'Общие очки' },
	{ value: 'item', label: 'Предмет' },
	{ value: 'perk', label: 'Перк' },
	{ value: 'effect', label: 'Эффект' },
]

const isNumeric = (type: RowType) =>
	type === 'points' || type === 'shared-points' || type === 'item'

/** the shared points belong to the party, so there is nobody to pick */
const SHARED_WHO = [{ value: '', label: 'Вся пати' }]

const userOptions = computed(() =>
	membersStore.users.map((p) => ({
		value: p.login,
		label: p.login === sessionStore.login ? `${p.login} (ты)` : p.login,
	})),
)

const resourceOptions = (type: RowType) => {
	if (type === 'points' || type === 'shared-points') {
		const types =
			type === 'points' ? resourcesStore.personalTypes : resourcesStore.sharedTypes

		return types.map((t) => ({ value: String(t.id), label: t.name }))
	}

	const kinds = { item: 'items', perk: 'perks', effect: 'effects' } as const

	return (resourcesStore.catalogs[kinds[type]] ?? []).map((o) => ({
		value: String(o.id),
		label: o.name,
	}))
}

const actionOptions = (type: RowType) =>
	isNumeric(type)
		? [
				{ value: 'plus', label: 'Добавить' },
				{ value: 'minus', label: 'Снять' },
			]
		: [
				{ value: 'grant', label: 'Выдать' },
				{ value: 'revoke', label: 'Забрать' },
			]

const newRow = (who: Login): Row => ({
	who,
	type: 'points',
	resId: resourceOptions('points')[0]?.value ?? '',
	act: 'plus',
	n: '',
})

const held = (row: Row) => {
	const resources = resourcesStore.byUser[row.who]
	const id = Number(row.resId)

	if (row.type === 'shared-points') return resourcesStore.sharedPoints[id] ?? 0

	if (!resources) return 0

	switch (row.type) {
		case 'points':
			return resources.points[id] ?? 0
		case 'item':
			return countItems(resources.items, id)
		case 'perk':
			return resources.perks.some((p) => p.id === id) ? 1 : 0
		case 'effect':
			return resources.effects.some((e) => e.id === id) ? 1 : 0
	}
}

/** the new value is outside of the bounds of the point type */
const outOfBounds = (row: Row, value: number) => {
	if (row.type !== 'points' && row.type !== 'shared-points') return false

	const type = resourcesStore.pointTypes.find((t) => t.id === Number(row.resId))

	return (
		!!type &&
		((type.minimum !== null && value < type.minimum) ||
			(type.maximum !== null && value > type.maximum))
	)
}

/** what the row does to the resources of the user and why it can't be applied */
const calc = (row: Row) => {
	const was = held(row)
	const name = resourceOptions(row.type).find((o) => o.value === row.resId)?.label ?? ''

	if (isNumeric(row.type)) {
		const amount = Math.abs(parseInt(row.n, 10) || 0)
		const delta = row.act === 'plus' ? amount : -amount
		const now = was + delta

		return {
			delta,
			duration: undefined,
			was: String(was),
			now: String(now),
			changed: was !== now,
			error: !amount
				? 'Укажи, сколько'
				: row.type === 'item' && now < 0
					? `Не хватает: ${name} у ${row.who}`
					: outOfBounds(row, now)
						? `${name}: значение выходит за границы`
						: '',
		}
	}

	const grant = row.act === 'grant'
	const span = row.n.trim()

	return {
		delta: 0,
		duration: row.type === 'effect' && grant && span ? parseSpan(span) : undefined,
		was: was ? 'есть' : 'нет',
		now: grant ? 'есть' : 'нет',
		changed: !!was !== grant,
		error:
			!grant && !was
				? `У ${row.who} нет: ${name}`
				: row.type === 'effect' && grant && span && parseSpan(span) === undefined
					? 'Срок указан неверно'
					: '',
	}
}

const hasAmount = (row: Row) =>
	isNumeric(row.type) || (row.type === 'effect' && row.act === 'grant')

const views = computed(() =>
	rows.value.map((row) => {
		const result = calc(row)
		const failed = !!result.error && (row.n !== '' || !isNumeric(row.type))

		return {
			row,
			result,
			isShared: row.type === 'shared-points',
			hasAmount: hasAmount(row),
			placeholder: isNumeric(row.type) ? '0' : '1 день',
			resources: resourceOptions(row.type),
			actions: actionOptions(row.type),
			tone: failed ? 'failed' : result.changed ? 'changed' : 'same',
		}
	}),
)

const onType = (row: Row, type: string) => {
	row.type = type as RowType
	row.resId = resourceOptions(row.type)[0]?.value ?? ''
	row.act = actionOptions(row.type)[0].value
	row.n = ''
}

const onWho = (row: Row, who: string) => {
	row.who = who
	panelUser.value = who
}

const addRow = () => rows.value.push(newRow(panelUser.value))

const toChange = (row: Row): ManualChange => {
	const id = Number(row.resId)
	const result = calc(row)

	switch (row.type) {
		case 'points':
			return { user: row.who, kind: 'points', id, delta: result.delta }
		case 'shared-points':
			return { kind: 'shared-points', id, delta: result.delta }
		case 'item':
			return { user: row.who, kind: 'item', id, delta: result.delta }
		case 'perk':
			return { user: row.who, kind: 'perk', id, op: row.act as 'grant' | 'revoke' }
		case 'effect':
			return {
				user: row.who,
				kind: 'effect',
				id,
				op: row.act as 'grant' | 'revoke',
				duration: result.duration,
			}
	}
}

const onApply = () => {
	if (!rows.value.length) {
		toastStore.show('Нет изменений', 'Добавь хотя бы одно изменение.', 'danger')
		return
	}

	const failed = views.value.find((v) => v.result.error)

	if (failed) {
		toastStore.show('Проверь изменения', `${failed.result.error}.`, 'danger')
		return
	}

	manualStore.apply(rows.value.map(toChange))
}

watch(
	() => rows.value.map((r) => r.who),
	(logins) => {
		for (const login of new Set(logins)) {
			if (!resourcesStore.byUser[login]) resourcesStore.loadUser(login)
		}
	},
)

onMounted(async () => {
	const current = draft.value

	// the form was restored after a restart, there is nothing to change
	if (!current) {
		router.replace({ name: RouteName.Home })
		return
	}

	panelUser.value = current.kind === 'fix' ? current.user : sessionStore.login

	await Promise.all([
		resourcesStore.loadSharedPoints(),
		resourcesStore.loadCatalog('items'),
		resourcesStore.loadCatalog('perks'),
		resourcesStore.loadCatalog('effects'),
	])

	if (current.kind !== 'fix') rows.value = [newRow(sessionStore.login)]
})
</script>

<template>
	<div v-if="draft" class="manual">
		<div class="crumbs">
			<a @click="manualStore.close()">{{ parentLabel }}</a>
			<span>/</span>
			<span class="crumbs__current">{{ currentLabel }}</span>
		</div>

		<UiPageTitle>
			{{ draft.kind === 'fix' ? 'Исправить запись' : 'Применить вручную' }}
		</UiPageTitle>

		<div class="layout">
			<div class="main">
				<div v-if="draft.kind === 'fix'" class="card">
					<div class="card__label">Исправляемая запись</div>
					<div class="entry entry--head">
						<span>Когда</span>
						<span>Кто и через что</span>
						<span>Изменения</span>
					</div>
					<div class="entry">
						<span class="entry__time">{{ formatMoment(draft.entry.at) }}</span>
						<span class="entry__who">
							<span class="entry__actor">{{ draft.entry.actor }}</span>
							<span class="entry__source">{{ formatJournalSource(draft.entry.source, draft.entry.correctsEntryId) }}</span>
							<UiBadge v-if="draft.entry.manual" tone="info" dot>вручную</UiBadge>
						</span>
						<span class="entry__changes">
							<UiBadge
								v-for="(change, i) in draft.entry.changes"
								:key="i"
								:tone="change.login === sessionStore.login ? 'accent' : 'neutral'"
							>
								{{ change.login ? `${change.login}: ` : '' }}{{ change.text }}
							</UiBadge>
						</span>
					</div>
				</div>

				<div v-else-if="draft.kind === 'wheel'" class="hero">
					<span class="hero__accent"></span>
					<span class="card__label">Выпало на колесе · {{ draft.group }}</span>
					<span class="hero__name">{{ draft.name }}</span>
					<span class="hero__desc">{{ draft.description }}</span>
				</div>

				<div class="card">
					<div class="card__label">Изменения</div>

					<div v-for="(view, i) in views" :key="i" class="row">
						<UiSelect
							v-if="view.isShared"
							compact
							label="Кому"
							:options="SHARED_WHO"
							model-value=""
							disabled
						/>
						<UiSelect
							v-else
							compact
							label="Кому"
							:options="userOptions"
							:model-value="view.row.who"
							@update:model-value="onWho(view.row, $event)"
						/>
						<UiSelect
							compact
							label="Тип"
							:options="typeOptions"
							:model-value="view.row.type"
							@update:model-value="onType(view.row, $event)"
						/>
						<UiSelect
							v-model="view.row.resId"
							compact
							label="Ресурс"
							:options="view.resources"
						/>
						<UiSelect
							v-model="view.row.act"
							compact
							label="Действие"
							:options="view.actions"
						/>
						<UiInput
							v-if="view.hasAmount"
							v-model="view.row.n"
							compact
							label="Сколько"
							:placeholder="view.placeholder"
						/>
						<div class="row__result">
							<div class="row__preview">
								<span class="row__label">Было → станет</span>
								<span class="row__values">
									<span class="row__was">{{ view.result.was }}</span>
									<span class="row__arrow">→</span>
									<span
										class="row__now"
										:class="`row__now--${view.tone}`"
									>
										{{ view.result.now }}
									</span>
								</span>
							</div>
							<span class="row__remove">
								<UiIconButton
									icon="x"
									size="sm"
									label="Убрать изменение"
									@click="rows.splice(i, 1)"
								/>
							</span>
						</div>
					</div>

					<div v-if="!rows.length" class="card__empty">
						Изменений пока нет. Нажми «Добавить изменение».
					</div>

					<div class="card__actions">
						<UiButton variant="ghost" size="sm" icon="plus" @click="addRow">
							Добавить изменение
						</UiButton>
						<span class="card__spacer"></span>
						<UiButton variant="outline" @click="manualStore.close()">Отмена</UiButton>
						<UiButton icon="check" @click="onApply">Применить</UiButton>
					</div>
				</div>

				<span class="note">
					{{ note }}
				</span>
			</div>

			<UserResourcesPanel v-model:user="panelUser" class="side" />
		</div>
	</div>
</template>

<style scoped>
.manual {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.crumbs {
	display: flex;
	align-items: center;
	gap: 8px;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.crumbs__current {
	color: var(--text-strong);
}

.layout {
	display: flex;
	flex-wrap: wrap;
	gap: 20px;
	align-items: flex-start;
}

.main {
	display: flex;
	flex: 999 1 460px;
	flex-direction: column;
	gap: 16px;
	min-width: 0;
}

.side {
	flex: 1 1 280px;
	box-sizing: border-box;
}

.card {
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.card__label {
	padding: 12px 16px 8px;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.card__empty {
	padding: 20px 16px;
	font: var(--type-body-sm);
	color: var(--text-muted);
	border-top: 1px solid var(--border-subtle);
}

.card__actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
	padding: 12px 16px;
	border-top: 1px solid var(--border-subtle);
}

.card__spacer {
	flex: 1;
}

.hero {
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 16px 20px;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.hero .card__label {
	padding: 0;
}

.hero__accent {
	position: absolute;
	top: 0;
	left: 20px;
	width: 48px;
	height: 4px;
	background: var(--accent);
	border-radius: 0 0 2px 2px;
}

.hero__name {
	font: var(--type-h3);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
}

.hero__desc {
	font: var(--type-body);
	color: var(--text-body);
	text-wrap: pretty;
}

.entry {
	display: grid;
	grid-template-columns: 120px minmax(0, 1fr) minmax(0, 1.5fr);
	gap: 16px;
	align-items: center;
	padding: 10px 16px;
	font: var(--type-body-sm);
}

.entry--head {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
	background: var(--surface-sunken);
}

.entry__time {
	font: var(--type-caption);
	color: var(--text-muted);
}

.entry__who {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.entry__actor {
	font-weight: 600;
	color: var(--text-strong);
}

.entry__source {
	color: var(--text-muted);
}

.entry__changes {
	display: flex;
	flex-wrap: wrap;
	gap: 4px;
}

.row {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
	gap: 12px;
	align-items: end;
	padding: 12px 16px;
	border-top: 1px solid var(--border-subtle);
}

.row__result {
	display: flex;
	align-items: flex-end;
	gap: 8px;
}

.row__preview {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
}

.row__label {
	font: 700 12px / 1 var(--font-display);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.row__values {
	display: flex;
	align-items: center;
	gap: 6px;
	height: 40px;
	font: var(--type-mono);
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}

.row__was {
	color: var(--text-muted);
}

.row__arrow {
	color: var(--text-subtle);
}

.row__now {
	font-weight: 700;
}

.row__now--same {
	color: var(--text-muted);
}

.row__now--changed {
	color: var(--text-strong);
}

.row__now--failed {
	color: var(--danger-text);
}

.row__remove {
	display: flex;
	align-items: center;
	height: 40px;
}

.note {
	font: var(--type-body-sm);
	color: var(--text-muted);
	text-wrap: pretty;
}
</style>
