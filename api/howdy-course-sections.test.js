import assert from 'node:assert/strict';
import test from 'node:test';
import handler from './howdy-course-sections.js';

const responseStub = () => ({
    headers: {}, statusCode: null, body: null,
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    send(body) { this.body = body; return this; },
    json(body) { this.body = body; return this; },
});

test('proxies Howdy POST data without exposing a browser cross-origin request', async () => {
    const originalFetch = globalThis.fetch;
    let upstreamRequest;
    globalThis.fetch = async (url, options) => {
        upstreamRequest = { url, options };
        return new Response('[{"course":"120"}]', { status: 200, headers: { 'content-type': 'application/json' } });
    };
    try {
        const response = responseStub();
        await handler({ method: 'POST', body: { termCode: '202631' } }, response);
        assert.equal(upstreamRequest.url, 'https://howdy.tamu.edu/api/course-sections');
        assert.deepEqual(JSON.parse(upstreamRequest.options.body), { termCode: '202631' });
        assert.equal(response.statusCode, 200);
        assert.equal(response.body, '[{"course":"120"}]');
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('rejects unsupported methods before contacting Howdy', async () => {
    const response = responseStub();
    await handler({ method: 'DELETE' }, response);
    assert.equal(response.statusCode, 405);
    assert.equal(response.headers.Allow, 'GET, POST');
});
