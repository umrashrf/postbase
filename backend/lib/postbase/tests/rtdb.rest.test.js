import request from 'supertest';
import { startTestServer } from './testServer.js';

let srv;

beforeAll(async () => {
    srv = await startTestServer();
});

afterAll(() => srv.close());

test('PUT + GET node', async () => {
    await request(srv.url)
        .put('/rtdb/users/u1')
        .send({ name: 'Alice' })
        .expect(200);

    const r = await request(srv.url)
        .get('/rtdb/users/u1')
        .expect(200);

    expect(r.body).toEqual({ name: 'Alice' });
});

test('PATCH merges value', async () => {
    await request(srv.url)
        .patch('/rtdb/users/u1')
        .send({ age: 20 })
        .expect(200);

    const r = await request(srv.url)
        .get('/rtdb/users/u1')
        .expect(200);

    expect(r.body).toEqual({ name: 'Alice', age: 20 });
});

test('PUSH creates child', async () => {
    const r = await request(srv.url)
        .post('/rtdb/users/u1/posts/push')
        .send({ title: 'hello' })
        .expect(201);

    expect(r.body.key).toBeDefined();
    expect(r.body.path).toMatch(/users\/u1\/posts\/.+/);
});
