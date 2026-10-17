import type { SpinCostRef, SpinPayment, UserResources } from '../api-facade/contracts'

export type PaymentChoice = {
	cost: SpinCostRef
	/** the copies the user holds that can pay the row; points have none, they are not chosen */
	options: { id: number; label: string }[]
}

const optionsOf = (cost: SpinCostRef, res: UserResources): PaymentChoice['options'] => {
	switch (cost.kind) {
		case 'item':
			return res.items
				.filter((i) => i.itemId === cost.id)
				.map((i) => ({ id: i.id, label: `${i.name} · осталось ${i.usesLeft} из ${i.usesMax}` }))
		case 'perk':
			return res.perks.filter((p) => p.id === cost.id).map((p) => ({ id: p.id, label: p.name }))
		case 'effect':
			return res.effects
				.filter((e) => e.id === cost.id)
				.map((e) => ({ id: e.id, label: e.name }))
		case 'points':
			return []
	}
}

export const paymentChoices = (cost: SpinCostRef[], res: UserResources): PaymentChoice[] =>
	cost.map((c) => ({ cost: c, options: optionsOf(c, res) }))

/** there are more copies than the cost takes, so the user picks which ones go */
export const needsChoice = (choice: PaymentChoice) =>
	choice.options.length > choice.cost.amount

/** `picked` holds the ids chosen for the rows that need a choice, by the index of the row */
export const buildPayment = (
	choices: PaymentChoice[],
	picked: Record<number, number[]>,
): SpinPayment => {
	const payment: SpinPayment = { items: [], perks: [], effects: [] }

	choices.forEach((choice, i) => {
		const ids = needsChoice(choice) ? (picked[i] ?? []) : choice.options.map((o) => o.id)

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
