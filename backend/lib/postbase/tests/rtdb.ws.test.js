import WebSocket from 'ws';
import request from 'supertest';
import { startTestServer } from './testServer.js';

let srv;
let wsClients = [];

// Start the server before all tests
beforeAll(async () => {
    srv = await startTestServer(); // should return { http server, wss, wsUrl }
});

// Close all WS clients after each test
afterEach(() => {
    wsClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    });
    wsClients.length = 0;
});

// Stop the server after all tests
afterAll(() => {
    if (srv.wss) srv.wss.close();
    if (srv.server) srv.server.close();
});

// Helper to connect WebSocket and wait for 'open'
function connectWS(url) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(url);
        wsClients.push(ws);
        ws.once('open', () => resolve(ws));
        ws.once('error', reject);
    });
}

function waitForMessage(ws) {
    return new Promise(res => {
        ws.once('message', m => res(JSON.parse(m)));
    });
}

test('exact path listener fires', async () => {
    const ws = await connectWS(srv.wsUrl);

    ws.send(JSON.stringify({ type: 'sub', path: 'users/u2' }));

    const msgPromise = waitForMessage(ws);

    await request(srv.url)
        .put('/rtdb/users/u2')
        .send({ online: true });

    const msg = await msgPromise;
    expect(msg.path).toBe('users/u2');
    expect(msg.value.online).toBe(true);
});

test('prefix listener fires for subtree', async () => {
    const ws = await connectWS(srv.wsUrl);

    ws.send(JSON.stringify({
        type: 'sub',
        path: 'users/u3',
        prefix: true,
    }));

    const msgPromise = waitForMessage(ws);

    await request(srv.url)
        .put('/rtdb/users/u3/profile')
        .send({ name: 'Bob' });

    const msg = await msgPromise;
    expect(msg.path).toBe('users/u3/profile');
});

test('field listener fires only on change', async () => {
    const ws = await connectWS(srv.wsUrl);

    ws.send(JSON.stringify({
        type: 'sub',
        path: 'users/u4',
        field: 'status',
    }));

    let msgPromise = waitForMessage(ws);

    await request(srv.url)
        .put('/rtdb/users/u4')
        .send({ status: 'offline' });

    let msg = await msgPromise;

    expect(msg.value).toBe('offline');

    msgPromise = waitForMessage(ws);

    // same value → should NOT fire
    await request(srv.url)
        .patch('/rtdb/users/u4')
        .send({ status: 'offline' });

    // change → should fire
    await request(srv.url)
        .patch('/rtdb/users/u4')
        .send({ status: 'online' });

    msg = await msgPromise;
    expect(msg.value).toBe('online');
});
