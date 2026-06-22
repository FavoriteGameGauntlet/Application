import { http } from '../http'
import type {
	GetAllLogins,
	GetDisplayName,
	PostDisplayName,
} from '../requests/users-requests'

export const apiUsers = {
	getAllNames: () =>
		http.get<GetAllLogins>('/users/all/names').then(({ body }) => body),

	postDisplayName: ({ body }: PostDisplayName['request']) =>
		http.post('/users/display-name', { body }),

	getDisplayName: () =>
		http.get<GetDisplayName>('/users/display-name').then(({ body }) => body),
}
