import spec from './example.json';
import OpenAPI from '../index.js';

describe('OpenAPI initialization', () => {
    it('generates client with dotted operation names', () => {
        const client = OpenAPI(spec);

        expect(client).toEqual({
            chatroom: {
                create: expect.anything(),
                retrieve: expect.anything(),
                search: expect.anything(),
                delete: expect.anything(),
            },
        });
    });
});

describe('OpenAPI invocation', () => {
    it('returns json', async () => {
        const data = { foo: 'bar' };

        const options = {
            adapter: () => Promise.resolve({ data }),
        };

        const client = OpenAPI(spec, 'test', options);
        const result = await client.chatroom.search();
        expect(result).toEqual(data);
    });
    it('handles empty data', async () => {
        const data = '';

        const options = {
            adapter: () => Promise.resolve({ data }),
        };

        const client = OpenAPI(spec, 'test', options);
        const result = await client.chatroom.delete(undefined, { chatroomId: 1 });
        expect(result).toEqual(data);
    });
    it('raises error', async () => {
        const options = {
            adapter: () => Promise.reject(new Error('errcode')),
        };

        const client = OpenAPI(spec, 'test', options);
        try {
            await client.chatroom.search();
            throw new Error('error expected');
        } catch (error) {
            // @ts-ignore
            expect(error.message).toEqual('errcode');
        }
    });
});
