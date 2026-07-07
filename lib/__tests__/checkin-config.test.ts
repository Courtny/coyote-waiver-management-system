import assert from 'node:assert/strict';
import path from 'path';
import { describe, it } from 'node:test';
import {
  CHECKIN_EVENTS_FILE,
  normalizeEventsArray,
  resolveEventsConfig,
  validateCheckinEvents,
} from '../checkin-config';

const configFilePath = path.join(process.cwd(), CHECKIN_EVENTS_FILE);

const validEnvJson = JSON.stringify([
  { id: 'prod-1', label: 'Test Event A' },
  { id: 'prod-2', label: 'Test Event B', eventPatchCount: 40 },
]);

describe('normalizeEventsArray', () => {
  it('parses valid event objects', () => {
    const events = normalizeEventsArray([
      { id: 'abc', label: 'Saturday' },
      { id: 'def', label: 'Sunday', eventPatchCount: 40 },
    ]);
    assert.equal(events.length, 2);
    assert.equal(events[1].eventPatchCount, 40);
  });

  it('skips invalid entries', () => {
    const events = normalizeEventsArray([{ label: 'no id' }, { id: 'ok', label: 'Good' }]);
    assert.equal(events.length, 1);
    assert.equal(events[0].id, 'ok');
  });
});

describe('validateCheckinEvents', () => {
  it('rejects empty arrays', () => {
    assert.deepEqual(validateCheckinEvents([]), ['events array must not be empty']);
  });

  it('rejects duplicate ids', () => {
    const errors = validateCheckinEvents([
      { id: 'dup', label: 'A' },
      { id: 'dup', label: 'B' },
    ]);
    assert.ok(errors.some((e) => e.includes('duplicate id')));
  });
});

describe('resolveEventsConfig', () => {
  it('uses env when valid', () => {
    const { events, eventsConfig } = resolveEventsConfig({ envRaw: validEnvJson });
    assert.equal(eventsConfig.source, 'env');
    assert.equal(events.length, 2);
    assert.equal(eventsConfig.warning, undefined);
  });

  it('falls back to file when env is empty', () => {
    const { events, eventsConfig } = resolveEventsConfig({
      envRaw: '',
      filePath: configFilePath,
    });
    assert.equal(eventsConfig.source, 'file');
    assert.ok(events.length > 0);
    assert.ok(eventsConfig.warning?.includes(CHECKIN_EVENTS_FILE));
  });

  it('falls back to file when env is invalid JSON', () => {
    const { events, eventsConfig } = resolveEventsConfig({
      envRaw: '{bad',
      filePath: configFilePath,
    });
    assert.equal(eventsConfig.source, 'file');
    assert.ok(events.length > 0);
    assert.ok(eventsConfig.warning?.includes('invalid'));
  });

  it('returns none when env and file are unavailable', () => {
    const { events, eventsConfig } = resolveEventsConfig({
      envRaw: '',
      filePath: path.join(process.cwd(), 'config/does-not-exist.json'),
    });
    assert.equal(eventsConfig.source, 'none');
    assert.equal(events.length, 0);
    assert.ok(eventsConfig.warning);
  });
});
