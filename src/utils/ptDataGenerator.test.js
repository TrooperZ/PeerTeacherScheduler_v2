import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPtSubmission, hasDragIntent, minutesToTime, snapMinutes, timeToMinutes } from './ptDataGenerator.js';

test('builds a stable PT preference submission', () => {
    assert.equal(minutesToTime(8 * 60 + 5), '08:05');
    assert.equal(timeToMinutes('13:30'), 810);
    assert.equal(snapMinutes(548), 555);
    assert.equal(hasDragIntent(3, 4), false);
    assert.equal(hasDragIntent(8, 1), true);

    const result = buildPtSubmission({
        firstName: ' Amin ', lastName: ' Karic ', uin: ' 635001568 ', desiredLabHours: '3', canPt: ['221', '120'], wantsPt: ['120'],
        busySlots: [{ day: 'T', start: 600, end: 660 }, { day: 'M', start: 540, end: 600 }],
        professors: { 120: { selected: ['Zbigniew Leyk'], other: '' }, 221: { selected: [], other: 'Other Professor' } },
    });

    assert.deepEqual(result.classesCanPT, ['120', '221']);
    assert.equal(result.uin, '635001568');
    assert.equal(result.desiredLabHours, 3);
    assert.deepEqual(result.busyTimes.M, ['09:00-10:00']);
    assert.deepEqual(result.professorsHad['221'], ['Other Professor']);
});
