// Loaded before production modules: tests must never contact the live database.
// All HTTP is replaced, and unexpected requests fail rather than falling through.
const rows = new Map();
globalThis.fetch = async (input, options = {}) => {
    const url = new URL(String(input));
    if (url.pathname !== '/rest/v1/pmc_matches_state') {
        throw new Error(`Unexpected network request in offline tests: ${url.pathname}`);
    }
    const method = (options.method || 'GET').toUpperCase();
    if (method === 'POST') {
        const row = JSON.parse(options.body);
        rows.set(row.id, structuredClone(row));
        return new Response(null, { status: 201 });
    }
    if (method === 'GET') {
        return Response.json([...rows.values()]);
    }
    throw new Error(`Unexpected HTTP method in offline tests: ${method}`);
};
