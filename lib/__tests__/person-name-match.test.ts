import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  firstNamesEquivalent,
  parsePersonName,
  personNamesMatch,
} from '../person-name-match';

describe('parsePersonName', () => {
  it('uses first given name and last surname, dropping Jr', () => {
    assert.deepEqual(parsePersonName("Christopher Sean O'Neal jr"), {
      first: 'christopher',
      last: 'oneal',
    });
  });

  it('strips parentheticals', () => {
    assert.deepEqual(parsePersonName('Sharon Albertson (Grant)'), {
      first: 'sharon',
      last: 'albertson',
    });
  });
});

describe('firstNamesEquivalent', () => {
  it('matches common short forms both directions', () => {
    assert.equal(firstNamesEquivalent('Benjamin', 'Ben'), true);
    assert.equal(firstNamesEquivalent('ben', 'benjamin'), true);
    assert.equal(firstNamesEquivalent('Liz', 'Elizabeth'), true);
    assert.equal(firstNamesEquivalent('Mike', 'Michael'), true);
    assert.equal(firstNamesEquivalent('Bill', 'William'), true);
    assert.equal(firstNamesEquivalent('Max', 'Maxwell'), true);
  });

  it('does not treat unrelated names as short forms', () => {
    assert.equal(firstNamesEquivalent('Tonya', 'Tony'), false);
    assert.equal(firstNamesEquivalent('Junior', 'Francisco'), false);
    assert.equal(firstNamesEquivalent('John', 'Jonathan'), false);
  });
});

describe('personNamesMatch', () => {
  it('matches exact first and last ignoring case', () => {
    assert.equal(personNamesMatch('benjamin marlowe', 'Benjamin', 'Marlowe'), true);
  });

  it('matches Max to Maxwell with the same last name', () => {
    assert.equal(personNamesMatch('MAX Edgecombe', 'maxwell', 'edgecombe'), true);
  });

  it('matches Ben to Benjamin Marlowe with the same last name', () => {
    assert.equal(personNamesMatch('Ben Marlowe', 'Benjamin', 'Marlowe'), true);
  });

  it('requires the last name to match', () => {
    assert.equal(personNamesMatch('Benjamin Marlowe', 'Benjamin', 'Fullenwider'), false);
    assert.equal(personNamesMatch('Daniel Johnson', 'Johnathan', 'Johnson'), false);
  });
});
