import { http } from '../http'
import type { GetSystemParameter } from '../requests/system-parameters-requests.ts'

export const apiSystemParameters = {
	getSystemParameter: ({ path: { name } }: GetSystemParameter['request']) =>
		http
			.get<GetSystemParameter>(`/system-parameters/${name}`)
			.then(({ body }) => body),
}
