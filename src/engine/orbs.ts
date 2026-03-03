import * as _ from 'lodash';
import * as tools from './tools';
import { walk } from './walk';

import { Orb } from '../types';
import { MatchData } from '../types';

// checks for one row of the iterchunk board for a potential match like [0010].
export function hasPotentialMatchInSingleRow(row: Orb[]): boolean {
    return _.max(_.values(_.countBy(row))) > 2;
};

// checks across both rows for a potential match, like [0101]
//                                                     [2031]
export function hasPotentialMatchInPairOfRows(pairOfRows: Orb[][]): boolean {
    let allValues: Orb[] = _.uniq(_.flatten(pairOfRows));
    let allMatches: number[][] = _.map(allValues, (value: Orb): number[] => {
        return _.uniq([...tools.indexOfAll(pairOfRows[0], value),
                       ...tools.indexOfAll(pairOfRows[1], value)]).sort();
    });

    return _.some(allMatches, (match: number[]) => {
        return _.some([
            _.isEqual(match, [0, 1, 2]),
            _.isEqual(match, [1, 2, 3]),
            _.isEqual(match, [0, 1, 2, 3]),
        ]);
    });
};

export function hasPotentialMatch(orbs: Orb[][]): boolean {
    // [[[1, 2, 3], [4, 5, 6]], [[6, 5, 4], [3, 2, 1]]]
    let chunks: Orb[][][] = [];
    _.each(walk.entireBoard(orbs), metadata => {
        chunks.push(metadata.orbs)
    });
    // [[1, 2, 3], [4, 5, 6], [6, 5, 4], [3, 2, 1]]
    let flatChunks: Orb[][] = _.flatten(chunks);
    let hasWideStyleMatch: boolean = _.some(_.map(flatChunks, hasPotentialMatchInSingleRow));
    return hasWideStyleMatch || _.some(_.map(chunks), hasPotentialMatchInPairOfRows);
};

export function swap(orbs: Orb[][], swapOrbs: number[][]): Orb[][] {
    let [[row1, col1], [row2, col2]] = swapOrbs;
    let orbsBefore: Orb[][] = _.cloneDeep(orbs);
    orbs[row1][col1] = orbsBefore[row2][col2]
    orbs[row2][col2] = orbsBefore[row1][col1]
    return orbs;
};

export { evaluate } from './evaluate';

/**
  * @private
  * @description Does the dirty work for unmatch by taking a given orb and swapping with a neighbor
  * of a different type, or a random orb on the board if there are no valid neighbors.
  * @see unmatch
  */
let _unmatch = (orbs: Orb[][], row: number, col: number, match: number[][], skipToRandom: boolean = false) => {
    let thisOrb: Orb = orbs[row][col];
    let swapped = false;
    let directions = _.shuffle(['up', 'down', 'left', 'right']);
    for (let i = 0; i < 4; i++) {
        // abandons the process and jumps to swapping a random orb
        if (skipToRandom) { break };
        if (directions[i] === 'up' && !_.isUndefined(orbs[row - 1]) && orbs[row - 1][col] !== thisOrb) {
            return swap(orbs, [[row, col], [row - 1, col]]);
        } else if (directions[i] === 'down' && !_.isUndefined(orbs[row + 1]) && orbs[row + 1][col] !== thisOrb) {
            return swap(orbs, [[row, col], [row + 1, col]]);
        } else if (directions[i] === 'left' && !_.isUndefined(orbs[row][col - 1]) && orbs[row][col - 1] !== thisOrb) {
            return swap(orbs, [[row, col], [row, col - 1]]);
        } else if (directions[i] === 'right' && !_.isUndefined(orbs[row][col + 1]) && orbs[row][col + 1] !== thisOrb) {
            return swap(orbs, [[row, col], [row, col + 1]]);
        }
    }
    while (!swapped) {
        let [randomRow, randomCol] = [_.random(orbs.length - 1), _.random(orbs[0].length - 1)];
        if (!_.includes(match, [randomRow, randomCol]) && orbs[randomRow][randomCol] !== thisOrb) {
            return swap(orbs, [[row, col], [randomRow, randomCol]]);
        }
    }
};
    
/**
  * @description Removes all match events one at a time by swapping a median or intersecting orb
  * with its neighbor or a random orb if necessary. 
  *
  * Intersectiions only occur if the match is not a simple match, i.e. it only spans one
  * column or one row.
  *
  * @example A simple match could go from 
  *         [ 1, 2, 3, 4 ],             [ 1, 2, 5, 4 ],
  *         [ 2, 5, 5, 5 ],             [ 2, 5, 3, 5 ],
  *         [ 3, 4, 1, 2 ],     to      [ 3, 4, 1, 2 ],
  *         [ 4, 1, 2, 3 ]              [ 4, 1, 2, 3 ]
  *
  * @example A multidimensional match could go from 
  *         [ 1, 2, 3, 4 ],             [ 1, 5, 3, 4 ],
  *         [ 2, 5, 5, 5 ],             [ 2, 2, 5, 5 ],
  *         [ 3, 5, 1, 2 ],     to      [ 3, 5, 1, 2 ],     orbs[1][1] was the
  *         [ 4, 5, 2, 3 ]              [ 4, 5, 2, 3 ]      intersection swapped
  *
  * @example A side-by-side match could go from 
  *         [ 1, 5, 5, 5 ],             [ 1, 5, 4, 5 ],                 [ 1, 5, 4, 5 ],
  *         [ 2, 5, 5, 5 ],             [ 2, 5, 5, 5 ],                 [ 2, 5, 1, 5 ],
  *         [ 3, 4, 1, 2 ],     to      [ 3, 4, 1, 2 ],    and then     [ 3, 4, 5, 2 ],
  *         [ 4, 1, 2, 3 ]              [ 5, 1, 2, 3 ]                  [ 5, 1, 2, 3 ]
  */
export function unmatch(orbs: Orb[][], match: number[][]): Orb[][] {
    let intersections: number[][] = [];
    // it is a simple match if all of the coords have only 1 rowCoord or 1 colCoord
    let [rowCoords, colCoords] = _.zip(...match);
    let isSimpleMatch = _.uniq(rowCoords).length === 1 || _.uniq(colCoords).length === 1;
    if (isSimpleMatch) {
        // finds the median orb in the match
        let median = Math.floor(match.length / 2);
        let [midRow, midCol] = match[median];

        // Checks for a side-by-side match, which could cause and endless loop.
        // In that case, the skipToRandom argument in _unmatch is triggered.
        let midNeighbors: Orb[];
        if (_.uniq(rowCoords).length === 1) {
            midNeighbors = [orbs[midRow][midCol - 1], orbs[midRow][midCol + 1]];
        } else {
            midNeighbors = [orbs[midRow - 1][midCol], orbs[midRow + 1][midCol]];
        }
        let isSideBySideMatch = _.includes(midNeighbors, orbs[midRow][midCol]);

        orbs = _unmatch(orbs, midRow, midCol, match, isSideBySideMatch);
    } else {
        // collects which rows and columns have matches in them
        let matchRows: number[] = [];
        let matchCols: number[] = [];
        _.each(_.countBy(rowCoords), (v, k) => {
            if (v > 2) {
                matchRows.push(_.toInteger(k));
            };
        });
        _.each(_.countBy(colCoords), (v, k) => {
            if (v > 2) {
                matchCols.push(_.toInteger(k));
            };
        });
        // if a coordinate is in a row match and a column match, it is an intersection
        _.each(match, coords => {
            if (_.includes(matchRows, coords[0]) && _.includes(matchCols, coords[1])) {
                intersections.push(coords);
            };
        });
        // chooses a random intersection to unmatch 
        let [row, col] = _.sample(intersections);
        _unmatch(orbs, row, col, match);
    };    
    return orbs;
};
