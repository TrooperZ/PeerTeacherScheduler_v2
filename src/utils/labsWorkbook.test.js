import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLabsWorkbook, buildPTWorkbook } from './labsWorkbook.js';

test('builds a color-coded labs workbook', async () => {
    const workbook = await buildLabsWorkbook([{ course: '120', section: '500', time: 'M 09:00 AM - 10:00 AM', location: 'ZACH 592', professor: 'Ada', pt: ['1'], color: '#0A84FF' }], [{ uin: '1', firstname: 'Amin', lastname: 'Karic' }]);
    const saved = await workbook.xlsx.writeBuffer();
    const restored = new workbook.constructor();
    await restored.xlsx.load(saved);
    const sheet = restored.getWorksheet('Labs');
    assert.equal(sheet.getCell('A2').value, '120-500');
    assert.equal(sheet.getCell('E2').value, 'Amin Karic');
    assert.equal(sheet.getCell('A2').fill.fgColor.argb, 'FFBADDFF');
});


test('builds a PT schedule and assignment changes workbook', async () => {
    const workbook = await buildPTWorkbook([{ course: '120', section: '500', time: 'M 09:00 AM - 10:00 AM', location: 'ZACH', hours: 1, pt: ['1'] }], [{ uin: '1', firstname: 'Amin', lastname: 'Karic' }], ['Added Amin']);
    const restored = new workbook.constructor();
    await restored.xlsx.load(await workbook.xlsx.writeBuffer());
    assert.equal(restored.getWorksheet('PT schedule').getCell('B2').value, '120-500');
    assert.equal(restored.getWorksheet('PT schedule').getCell('F2').value, 1);
    assert.equal(restored.getWorksheet('Assignment changes').getCell('A2').value, 'Added Amin');
});
