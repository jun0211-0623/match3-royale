'use strict';
import * as _ from 'lodash';
import * as orbs from './orbs';
import * as triples from './triples';

import { Orb } from '../types';
import { MatchData } from '../types';

export class Board {
    width: number;
    height: number;
    types: Orb[]
    orbs: Orb[][];
    attic: Board;
    constructor (width: number = 8, height: number = 8, types: Orb[] = _.range(7), needsAttic: boolean = true) {
        this.width = width;
        this.height = height;
        this.types = types;
        this.generateOrbs();
        if (this.hasMatch() || this.needsShuffle()) {
            this.shuffle();
        };
        if (needsAttic) {
            this.attic = new Board(this.width, this.height, this.types, false);
        };
    }

    get size(): [number, number] {
        return [this.width, this.height];
    }

    get availableTypes(): Orb[] {
        return _.uniq(_.flatten(this.orbs)).sort();
    }
    
    get triples(): number[][][] {
        return triples.find(this.orbs);
    }
    
    get matches(): number[][][] {
        return triples.combine(this.triples);
    }
    
    generateOrbs(): void {
        let chooseOrb = () => { return _.sample(this.types); };
        let sampleRow = () => { return _.times(this.width, chooseOrb); };
        this.orbs = _.zip(..._.times(this.height, sampleRow));
    }

    resetAttic(): void {
        this.attic = new Board(this.width, this.height, this.types, false);
    }

    evaluate(): MatchData {
        let [newOrbs, matchData] = orbs.evaluate(this.orbs, this.matches, this.attic.orbs);
        this.orbs = newOrbs;
        return matchData;

    }

    needsShuffle(): boolean {
        return !this.hasPotentialMatch();
    }

    hasPotentialMatch(): boolean {
        return orbs.hasPotentialMatch(this.orbs);
    }
    
    hasMatch(): boolean {
        return Boolean(triples.find(this.orbs)[0]);
    }

    swap(swapOrbs): void {
        this.orbs = orbs.swap(this.orbs, swapOrbs);
    }
    
    unmatch(): void {
        while(this.hasMatch()) {
            this.orbs = orbs.unmatch(this.orbs, this.matches[0]);
        }
    }

    shuffle(): void {
        this.orbs = _.map(this.orbs, row => _.shuffle(row));
        this.unmatch();
        if (this.needsShuffle()) {
            this.shuffle();
        };
    }
};
