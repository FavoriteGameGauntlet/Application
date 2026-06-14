import { http } from '../http'
import type {
	GetExperiencePoints,
	GetFreePoints,
	GetFreePointsHistory,
	GetPointsAllInfo,
	GetPointsInfo,
	GetTerritoryHours,
	GetTerritoryPoints,
	GetTerritoryPointsHistory,
	PostExperiencePoints,
	PostFreePoints,
	PostTerritoryHours,
	PostTerritoryPoints,
} from '../requests/points-requests'
import {
	convertFreePointChangeHistoryDto,
	convertTerritoryPointChangeHistoryDto,
} from '../dto.ts'

export const apiPoints = {
	getPointsInfo: ({ path: { login } }: GetPointsInfo['request']) =>
		http.get<GetPointsInfo>(`/points/${login}/info`).then(({ body }) => body),

	getPointsAllInfo: () =>
		http.get<GetPointsAllInfo>('/points/all/info').then(({ body }) => body),

	postTerritoryPoints: ({
		body,
		path: { login },
	}: PostTerritoryPoints['request']) =>
		http
			.post<PostTerritoryPoints>(`/points/${login}/territory-points`, { body })
			.then(({ body }) => body),

	getTerritoryPoints: ({ path: { login } }: GetTerritoryPoints['request']) =>
		http
			.get<GetTerritoryPoints>(`/points/${login}/territory-points`)
			.then(({ body }) => body),

	getTerritoryPointsHistory: ({
		path: { login },
	}: GetTerritoryPointsHistory['request']) =>
		http
			.get<GetTerritoryPointsHistory>(
				`/points/${login}/territory-points/history`,
			)
			.then(({ body }) => body.map(convertTerritoryPointChangeHistoryDto)),

	postFreePoints: ({ body, path: { login } }: PostFreePoints['request']) =>
		http
			.post<PostTerritoryPoints>(`/points/${login}/free-points`, { body })
			.then(({ body }) => body),

	getFreePoints: ({ path: { login } }: GetFreePoints['request']) =>
		http
			.get<GetFreePoints>(`/points/${login}/free-points`)
			.then(({ body }) => body),

	getFreePointsHistory: ({
		path: { login },
	}: GetFreePointsHistory['request']) =>
		http
			.get<GetFreePointsHistory>(`/points/${login}/free-points/history`)
			.then(({ body }) => body.map(convertFreePointChangeHistoryDto)),

	postExperiencePoints: ({ body }: PostExperiencePoints['request']) =>
		http
			.post<PostExperiencePoints>(`/points/experience-points`, { body })
			.then(({ body }) => body),

	getExperiencePoints: () =>
		http
			.get<GetExperiencePoints>(`/points/experience-points`)
			.then(({ body }) => body),

	postTerritoryHours: ({ body }: PostTerritoryHours['request']) =>
		http
			.post<PostTerritoryHours>(`/points/territory-hours`, { body })
			.then(({ body }) => body),

	getTerritoryHours: () =>
		http
			.get<GetTerritoryHours>(`/points/territory-hours`)
			.then(({ body }) => body),
}
