// tests/rtdb.client.integration.test.js
import request from 'supertest';
import { startTestServer } from '../../../../backend/lib/postbase/tests/testServer';
import { RtdbClient } from '../rtdb';
import { delay } from '../utils.js';

let srv;
let client;

beforeAll(async () => {
    srv = await startTestServer();

    client = new RtdbClient({
        restUrl: srv.url,
        wsUrl: srv.wsUrl
    });

    await client.connect();
});

afterEach(async () => {
    client.off('users/u2');
    client.off('users/u4/status');
});

afterAll(() => {
    if (srv.wss) srv.wss.close();
    if (srv.server) srv.server.close();
});

test('set + get', async () => {
    await client.set('users/u1', { online: true });
    const v = await client.get('users/u1');
    expect(v.online).toBe(true);
});

test('on fires on change (whole path)', async () => {
    const received = [];
    const unsub = await client.on('users/u2', (val) => received.push(val));
    await client.set('users/u2', { online: true });
    // wait briefly for ws
    await new Promise(r => setTimeout(r, 100));
    expect(received.length).toBe(1);
    expect(received[0].online).toBe(true);
    unsub();
});

test("field listener fires only when changed", async () => {
    const msgs = [];

    const unsub = await client.on("users/u4/status", v => msgs.push(v));

    await request(srv.url)
        .put("/rtdb/users/u4")
        .send({ status: "offline" });

    await delay(50);
    expect(msgs).toContain("offline");

    msgs.length = 0;

    await request(srv.url)
        .patch("/rtdb/users/u4")
        .send({ status: "offline" });

    await request(srv.url)
        .patch("/rtdb/users/u4")
        .send({ status: "online" });

    await delay(50);
    expect(msgs).toContain("online");

    unsub();
});

