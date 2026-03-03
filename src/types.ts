export type Orb = string | number

export type MatchData = [Orb, number][]

export interface PositionInfo {
    first: number[];
	last: number[];
}

export interface Chunk {
    orbs: Orb[][];
    positionInfo?: PositionInfo
}