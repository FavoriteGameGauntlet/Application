import type {
	FreePointChange,
	FreePointChangeHistoryDto,
	FreePointChangeResult,
	PointChange,
	PointChangeResult,
	PointInfo,
	TerritoryPointChangeHistoryDto,
	TerritoryPointChangeResult,
} from '../models/points-models'

export type GetPointsInfo = {
	request: {
		path: {
			login: string
		}
	}
	response: PointInfo
}

export type GetPointsAllInfo = {
	response: {
		login: string
		pointInfo: PointInfo
	}[]
}

export type PostTerritoryPoints = {
	request: {
		path: {
			login: string
		}
		body: PointChange
	}
	response: TerritoryPointChangeResult
}

export type GetTerritoryPoints = {
	request: {
		path: {
			login: string
		}
	}
	response: number
}

export type GetTerritoryPointsHistory = {
	request: {
		path: {
			login: string
		}
	}
	response: TerritoryPointChangeHistoryDto[]
}

export type PostFreePoints = {
	request: {
		path: {
			login: string
		}
		body: FreePointChange
	}
	response: FreePointChangeResult
}

export type GetFreePoints = {
	request: {
		path: {
			login: string
		}
	}
	response: number
}

export type GetFreePointsHistory = {
	request: {
		path: {
			login: string
		}
	}
	response: FreePointChangeHistoryDto[]
}

export type PostExperiencePoints = {
	request: {
		body: PointChange
	}
	response: PointChangeResult
}

export type GetExperiencePoints = {
	response: number
}

export type PostTerritoryHours = {
	request: {
		body: PointChange
	}
	response: PointChangeResult
}

export type GetTerritoryHours = {
	response: number
}
