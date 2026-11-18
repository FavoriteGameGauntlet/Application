import type { Payment } from '../contracts'

/** the backend names the lists by what they hold, the contract by the kind of the resource */
export const toPaymentBody = ({ items, perks, effects }: Payment) => ({
	userItemIds: items,
	perkIds: perks,
	userEffectIds: effects,
})
