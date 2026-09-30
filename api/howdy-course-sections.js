const HOWDY_URL = 'https://howdy.tamu.edu/api/course-sections';

export default async function handler(request, response) {
    if (!['GET', 'POST'].includes(request.method)) {
        response.setHeader('Allow', 'GET, POST');
        return response.status(405).json({ error: 'Method not allowed.' });
    }

    try {
        const upstream = await fetch(HOWDY_URL, {
            method: request.method,
            headers: {
                Accept: 'application/json',
                ...(request.method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
            },
            ...(request.method === 'POST' ? { body: JSON.stringify(request.body) } : {}),
        });
        const body = await upstream.text();
        response.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
        return response.status(upstream.status).send(body);
    } catch {
        return response.status(502).json({ error: 'Howdy course data is unavailable. Try again or upload a saved response.' });
    }
}
