import type { Api, ManualChange } from '../contracts'
import { http } from '../http'
import { partyPath } from './context'
import { latestOwnEntry } from './journal'
import { type ChangeEntryDto, fromChangeRow } from './rows'

const toEntry = (change: Exclude<ManualChange, { kind: 'shared-points' }>) => {
	switch (change.kind) {
		case 'points':
			return fromChangeRow({ kind: 'points', targetId: change.id, amount: change.delta })
		case 'item':
			// the backend takes copies away only by using an item
			if (change.delta < 0) {
				throw new Error('The backend cannot take items away by hand')
			}

			return fromChangeRow({ kind: 'item', targetId: change.id, amount: change.delta })
		default:
			// an effect lasts as long as its catalogue entry says
			return fromChangeRow({
				kind: change.kind,
				targetId: change.id,
				amount: change.op === 'grant' ? 1 : -1,
			})
	}
}

export const manual: Api['manual'] = {
	apply: async ({ changes, correctsEntryId }) => {
		const path = await partyPath()
		const byUser = new Map<string, ChangeEntryDto[]>()

		for (const change of changes) {
			if (change.kind === 'shared-points') {
				await http.patch(`${path}/points/party/types/${change.id}`, {
					body: { desiredChangeValue: change.delta },
				})

				continue
			}

			byUser.set(change.user, [...(byUser.get(change.user) ?? []), toEntry(change)])
		}

		// users who get the same entries share one request and one history event
		const groups = new Map<string, { entries: ChangeEntryDto[]; logins: string[] }>()

		for (const [login, entries] of byUser) {
			const key = JSON.stringify(entries)
			const group = groups.get(key) ?? { entries, logins: [] }

			group.logins.push(login)
			groups.set(key, group)
		}

		for (const { entries, logins } of groups.values()) {
			await http.post(`${path}/grants`, {
				body: {
					targetLogins: logins,
					entries,
					...(correctsEntryId !== undefined && { correctsEntryId }),
				},
			})
		}

		return { journalEntry: await latestOwnEntry() }
	},
}
