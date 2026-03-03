import * as _ from 'lodash';
import * as tools from './tools';

import { Orb } from '../types';
import { MatchData } from '../types';

interface OrbCounts { 
    [col: number]: number 
}

interface BlanksBelow {
    [coord: string]: number
}

/**
  * @description Takes a post-swap set of orbs, gathers the match data for each of the matches,
  * marks each orb in the match with '\u241a', pulls down non-match orbs over the 'marked' orbs,
  * and pulls down new orbs from the attic to fill in the rest of the board.
  *
  * @example
  *                 [5, 6, 7, 8, 9],
  *                 [6, 7, 8, 9, 5],
  *     atticOrbs   [7, 8, 9, 5, 6],
  *                 [8, 9, 5, 6, 7],
  *                 [9, 5, 6, 7, 8]                    new orbs
  *                                                                             matchData
  *                 [0, 1, 2, 3, 4],                [0, 5, 6, 7, 4],         [type, length]
  *                 [1, 2, 3, 4, 0],     returns    [1, 1, 2, 3, 0],
  *     orbs        [2, 0, 0, 0, 1],       -->      [2, 2, 3, 4, 1],     and     [0, 3]
  *                 [3, 4, 0, 1, 2],                [3, 4, 0, 1, 2],
  *                 [4, 0, 1, 2, 3]                 [4, 0, 1, 2, 3]
  */
export function evaluate(orbs: Orb[][], matches: number[][][], atticOrbs: Orb[][]): [Orb[][], MatchData] {
    let matchData = getMatchData(orbs, matches);
    orbs = releaseAttic(activateGravity(markMatches(orbs, matches)), atticOrbs, getOrbCounts(matches));
    return [orbs, matchData];
};

export function getMatchData(orbs: Orb[][], matches: number[][][]): MatchData {
    let matchData: MatchData = [];
    _.each(matches, match => {
        matchData.push([orbs[match[0][0]][match[0][1]], match.length]);
    })
    return matchData;
}

/**
  * @description Replaces the value of each orb from the matches with a new value
  * of '\u241a'
  */
export function markMatches(orbs: Orb[][], matches: number[][][]): Orb[][] {
    let matchData: MatchData = [];
    _.each(matches, match => {
        _.each(match, coord => {
            let [row, col] = coord;
            orbs[row][col] = '\u241a'
        })
    });
    return orbs;
}

/**
  * @description Gets the orbCounts object based on a board's matches.
  *
  * The orbCounts object tells how many orbs from the matches are in each column.
  * This provides necessary data for releaseAttic.
  *
  * @see releaseAttic
  */
export function getOrbCounts(matches: number[][][]): OrbCounts {
    let orbCounts: OrbCounts = {};
    _.each(matches, match => {
        _.each(match, coord => {
            if (orbCounts[coord[1]]) {
                orbCounts[coord[1]] += 1;
            } else {
                orbCounts[coord[1]] = 1;
            };
        });
    });
    return orbCounts;
};

/**
  * @description Returns an object that tells how many 'blanks' are below each coordinate.
  * It only records the data if there is at least one blank below that coordinate. A blank
  * is an orb that was a part of a match and has subsequently been marked with a value
  * of '\u241a', which is the symbol for substitute: '␚'.
  *
  * The format is this:
  *
  *     blanksBelow = {
  *         'row col': blankCount
  *     }
  *
  * @example
  *     [
  *         [0, 1, 2, 3, 4],                blanksBelow = {
  *         [1, ␚, ␚, ␚, 0],                    '0 1': 1,
  *         [2, 3, 4, 0, 1],    -->             '0 2': 1,
  *         [3, 4, 0, 1, 2],                    '0 3': 1
  *         [4, 0, 1, 2, 3]                 }
  *     ]
  *
  * @see activateGravity
  */
export function getBlanksBelow(orbs: Orb[][]): BlanksBelow {
    let blanksBelow: BlanksBelow = {};
    let height: number = orbs[0].length;
    let width: number = orbs.length;
    _.each(_.rangeRight(width - 1), row => {
        _.each(_.range(height), col => {
            let blankCount = 0;
            _.each(_.range(1, height - row), adder => {
                if (orbs[row + adder][col] === '\u241a') {
                    blankCount += 1;
                };
            });
            if (blankCount > 0) {
                blanksBelow[`${row}, ${col}`] = blankCount;
            };
        });
    });
    return blanksBelow;
};

/**
  * @description Drops down unaffected orbs into their new post-evaluated position.
  * NOTE: The orbs in the top rows that will be replaced with attic.orbs are left unchanged
  * by this function.
  */
export function activateGravity(orbs: Orb[][]): Orb[][] {
    let orbsBefore = orbs;
    _.each(getBlanksBelow(orbs), (count: number, coord:string) => {
        let [row, col] = _.map(coord.split(','), _.toInteger);
        orbs[row + count][col] = orbsBefore[row][col];
    })
    return orbs
};

/**
  * @description Returns an array of orb values that are to be dropped down, starting
  * with the bottom-most atticOrb and working up.
  *
  * @see releaseAttic
  */
export function atticOrbsToDropDown(atticOrbs: Orb[][], col: string | number, count: number): Orb[] {
    let lastRow = atticOrbs.length;
    let atticOrbsToDropDown: Orb[] = [];
    _.each(_.range(count), n => {
        atticOrbsToDropDown.push(atticOrbs[lastRow - 1 - n][col])
    });
    return atticOrbsToDropDown;
};

/**
  * @description Drops down the necessary orbs from the attic into the main orb set.
  */
export function releaseAttic(orbs: Orb[][], atticOrbs: Orb[][], orbCounts: OrbCounts): Orb[][] {
    _.each(orbCounts, (count, col) => {
        let dropdowns = atticOrbsToDropDown(atticOrbs, col, count);
        _.each(_.range(count), row => {
            orbs[row][col] = dropdowns.pop()
        });
    });
    return orbs
};
