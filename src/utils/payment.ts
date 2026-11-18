import type { CostRef, Payment, UserResources } from '../api-facade/contracts'
import { formatUsesLeft } from './formatResource'

export type PaymentChoice = {
	cost: CostRef
	/** the copies the user holds that can pay the row; points have none, they are not chosen */
	options: { id: number; label: string; meta?: string }[]
}

const optionsOf = (
	cost: CostRef,
	res: UserResources,
): PaymentChoice['options'] => {
	switch (cost.kind) {
		case 'item':
			return res.items
				.filter((i) => i.itemId === cost.id)
				.map((i) => ({ id: i.id, label: i.name, meta: formatUsesLeft(i) }))
		case 'perk':
			return res.perks
				.filter((p) => p.id === cost.id)
				.map((p) => ({ id: p.id, label: p.name }))
		case 'effect':
			return res.effects
				.filter((e) => e.effectId === cost.id)
				.map((e) => ({ id: e.id, label: e.name }))
		case 'points':
			return []
	}
}

export const paymentChoices = (
	cost: CostRef[],
	res: UserResources,
): PaymentChoice[] => cost.map((c) => ({ cost: c, options: optionsOf(c, res) }))

/** the user picks the copies of a row themself, also when they hold just as many as it takes; points are charged by themselves */
export const isPicked = (choice: PaymentChoice) => choice.cost.kind !== 'points'

/** `picked` holds the ids the user chose, by the index of the row; a row without them gives every copy it lists */
export const buildPayment = (
	choices: PaymentChoice[],
	picked: Record<number, number[]>,
): Payment => {
	const payment: Payment = { items: [], perks: [], effects: [] }

	choices.forEach((choice, i) => {
		const ids = picked[i] ?? choice.options.map((o) => o.id)

		switch (choice.cost.kind) {
			case 'item':
				payment.items.push(...ids)
				break
			case 'perk':
				payment.perks.push(...ids)
				break
			case 'effect':
				payment.effects.push(...ids)
				break
		}
	})

	return payment
}

/** how many spins the held resources pay for; undefined when the spin is free */
export const affordableSpins = (cost: CostRef[], res?: UserResources) => {
	if (!cost.length) return undefined
	if (!res) return 0

	return Math.min(
		...cost.map((c) => {
			const held =
				c.kind === 'points' ? (res.points[c.id] ?? 0) : optionsOf(c, res).length

			return Math.floor(held / c.amount)
		}),
	)
}
