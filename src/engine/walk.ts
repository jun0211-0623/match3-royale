import * as _ from 'lodash';

import { Orb } from '../types';
import { Chunk } from '../types';

export const walk = {
    horizontally: horizontally,
    vertically: vertically,
    entireBoard: entireBoard
};

function horizontally (orbs: Orb[][], chunkLimitRange: [number, number] = [4, 2], includePositionInformation = false) {
    return _walkBoard(orbs, chunkLimitRange, includePositionInformation, false);
}

function vertically (orbs: Orb[][], chunkLimitRange: [number, number] = [4, 2], includePositionInformation = false) {
    return _walkBoard(_.zip(...orbs), chunkLimitRange, includePositionInformation, true);
}

function entireBoard (orbs: Orb[][], chunkLimitRange: [number, number] = [4, 2], includePositionInformation = false) {
    return [
        ...horizontally(orbs, chunkLimitRange, includePositionInformation),
        ...vertically(orbs, chunkLimitRange, includePositionInformation)
    ]
}


/**
 * @private
 * @description Used to provide more granularity to functions that need to call iterchunks
 * on a non-transposed set of orbs, as well as a transposed set of orbs.
 * @see findTriples
 */
function _walkBoard (orbs: Orb[][], chunkLimitRange: [number, number], includePositionInformation: boolean, isTransposed: boolean): Chunk[] {
    let chunks: Chunk[] = [];
    let [width, height] = chunkLimitRange;
    let [finalPositionWidth, finalPositionHeight] = [orbs[0].length - width, orbs.length - height];
    _.each(_.range(0, finalPositionHeight + 1), heightIndex => {
        _.each(_.range(0, finalPositionWidth + 1), widthIndex => {
            let chunk: Chunk = { orbs: undefined };
            chunk.orbs = orbs.slice(heightIndex, heightIndex + height).map(row => {
                return row.slice(widthIndex, widthIndex + width);
            });

            if (includePositionInformation) {
                let startingCoordinates: number[] = [heightIndex, widthIndex];
                let endingCoordinates: number[] = [heightIndex + height - 1, widthIndex + width - 1];
                if (isTransposed) {
                    startingCoordinates = startingCoordinates.reverse();
                    endingCoordinates = [endingCoordinates[1], endingCoordinates[0]];
                }

                chunk.positionInfo = {
                    first: startingCoordinates,
                    last: endingCoordinates
                };
            }

            chunks.push(chunk);
        });
    });
    return chunks;
};

/**
 * With `orbs` being
 * [ [ 6, 5, 4 ],
 *   [ 3, 2, 2 ],
 *   [ 6, 4, 0 ] ]
 * And with a [3, 2] `chunkLimitRange`, this will yield each 3x2
 * grouping, and then, each available 2x3 grouping.
 * [
 *     { chunk: [ [6, 5, 4], [3, 2, 2] ] },
 *     { chunk: [ [3, 2, 2], [6, 4, 0] ] },
 *     { chunk: [ [6, 3, 6], [5, 2, 4] ] },
 *     { chunk: [ [5, 2, 4], [4, 2, 0] ] }
 * ]
 * 
 * If you want to also return the position of the first member of the chunk,
 * as row/col coordinates, pass in `includePositionInformation`. That will return the
 * same data as above, but with an extra piece of information in each object, a 
 * `position` key that maps to the first and last row/col coordinates of that chunk.
 * [
 *     {
 *         chunk: [[6, 5, 4], [3, 2, 2]],
 *         positionInfo: {
 *             first: [0, 0],
 *             last: [1, 2]
 *         }
 *     },
 *     {
 *         chunk: [[3, 2, 2], [6, 4, 0]],
 *         positionInfo: {
 *             first: [1, 0],
 *             last: [2, 2]
 *         }
 *     },
 *     {
 *         chunk: [[6, 3, 6], [5, 2, 4]],
 *         positionInfo: {
 *             first: [0, 0],
 *             last: [2, 1]
 *         }
 *     },
 *     {
 *         chunk: [[5, 2, 4], [4, 2, 0]],
 *         positionInfo: {
 *             first: [0, 1],
 *             last: [2, 2]
 *         }
 *     }
 * ]
 */
export function walkBoard (orbs: Orb[][], chunkLimitRange: [number, number] = [4, 2], includePositionInformation = false): Chunk[] {
    let transposedOrbs: Orb[][] = _.zip(...orbs);
    return [
            ..._walkBoard(orbs, chunkLimitRange, includePositionInformation, false),
            ..._walkBoard(transposedOrbs, chunkLimitRange, includePositionInformation, true)
    ]
};