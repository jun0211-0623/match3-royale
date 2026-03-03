import * as _ from 'lodash';
import * as tools from './tools';
import { walk } from './walk';
declare var require: any;
let SortedSet = require('collections/sorted-set');

import { Orb } from '../types';
import { Chunk } from '../types';

let _findTriples = (chunks: Chunk[], isTransposed: boolean): number[][][] => {
    let triples: number[][][] = [];

    _.each(chunks, chunk => {
        let orbs = chunk.orbs[0];
        if (_.uniq(orbs).length === 1) {
            let anchor = chunk.positionInfo.first;
            let firstOrb: number[] = anchor;
            let secondOrb: number[];
            let thirdOrb: number[];

            if (isTransposed) {
                secondOrb = [anchor[0] + 1, anchor[1]];
                thirdOrb = [anchor[0] + 2, anchor[1]];
            } else {
                secondOrb = [anchor[0], anchor[1] + 1];
                thirdOrb = [anchor[0], anchor[1] + 2];
            }

            let absolutePositions = [
                firstOrb,
                secondOrb,
                thirdOrb
            ];
            triples.push(absolutePositions);
        }
    });

    return triples;
};

/**
  * @description Gathers all triples, which are the coordinates for all instances of 
  * three consecutive matching orbs, first in rows, then in columns.
  */
export function find(orbs: Orb[][]): number[][][] {
    let horizontalChunks = walk.horizontally(orbs, [3, 1], true);
    let verticalChunks = walk.vertically(orbs, [3, 1], true);

    return [
            ..._findTriples(horizontalChunks, false),
            ..._findTriples(verticalChunks, true)
    ];
};

export function combine(triples: number[][][]): number[][][] {
    let matches: number[][][] = [];
    let unused = triples;
    let couldMatch: number[][][];
    let before: number[][];
    let currentMatch: any;

    while (unused[0] != null) {
        currentMatch = new SortedSet(unused[0]);
        unused.shift();
        couldMatch = _.clone(unused);

        _.each(couldMatch, m => {
            //only union if there is an overlap!
            if (currentMatch.intersection(m).toArray()[0] != undefined) {
                before = currentMatch.toArray();
                currentMatch.swap(0, currentMatch.length, currentMatch.union(m));
                if (before != currentMatch.toArray()) {
                    unused.splice(unused.indexOf(m), 1);
                }
            }
        });
        matches.push(currentMatch.toArray());
    }
    return matches;
};

