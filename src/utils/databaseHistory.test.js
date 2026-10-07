import assert from 'node:assert/strict';
import test from 'node:test';
import { createDatabaseChanges, loadDatabaseHistory, replayDatabaseHistory, summarizeDatabaseChanges } from './databaseHistory.js';

test('database history exactly replays schedule and settings changes', () => {
    const base = {
        labs: [{ course: '111', section: '501', pt: ['1', '2'] }],
        peerTeachers: [{ uin: '1', firstname: 'Ada', lastname: 'Lovelace', labs: [{ course: '111', section: '501' }] }],
        settings: { autoschedulerAlgorithm: 'priority' },
    };
    const next = {
        labs: [{ course: '111', section: '501', pt: ['2'] }],
        peerTeachers: [{ uin: '1', firstname: 'Ada', lastname: 'Lovelace', labs: [] }],
        settings: { autoschedulerAlgorithm: 'scarcity' },
    };
    const history = { base, entries: [{ timestamp: '2026-09-30T12:00:00.000Z', changes: createDatabaseChanges(base, next) }] };

    assert.deepEqual(replayDatabaseHistory(history, 0), next);
    assert.deepEqual(loadDatabaseHistory(next, history), history);
    assert.deepEqual(loadDatabaseHistory(next, { broken: true }), { base: next, entries: [] });
    assert.deepEqual(loadDatabaseHistory(next, {
        base,
        entries: [{ timestamp: '2026-09-30T12:00:00.000Z', changes: [{ op: 'replace', path: ['settings', '__proto__'], after: {} }] }],
    }), { base: next, entries: [] });

    assert.deepEqual(summarizeDatabaseChanges(base, next, history.entries[0].changes), [
        { title: 'Removed Ada Lovelace', detail: 'CSCE 111-501', before: 'Ada Lovelace, PT 2', after: 'PT 2' },
        { title: 'Changed Autoscheduler Algorithm', detail: 'Setting', before: '"priority"', after: '"scarcity"' },
    ]);
});
