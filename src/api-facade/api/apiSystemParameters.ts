import { http } from '../http'
import type {
	GetAllSystemParameters,
	GetSystemParameter,
} from '../requests/system-parameters-requests.ts'

export const apiSystemParameters = {
	getSystemParameter: ({ path: { name } }: GetSystemParameter['request']) =>
		http
			.get<GetSystemParameter>(`/system-parameters/app/${name}`)
			.then(({ body }) => body),

	getAllSystemParameters: () =>
		http
			.get<GetAllSystemParameters>(`/system-parameters/app/all`)
			.then(({ body }) => body),
}
