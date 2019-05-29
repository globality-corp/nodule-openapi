import spec from './example.json';
import buildRequest from '../request';


describe('buildRequest', () => {
    it('uses default builders', () => {
        const context = {
            spec,
            path: '/chatroom',
            method: 'post',
        };
        const req = null;
        expect(
            buildRequest(context, req, {
                body: {
                    foo: 'bar',
                },
            }),
        ).toEqual({
            adapter: null,
            data: {
                foo: 'bar',
            },
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            maxContentLength: -1,
            method: 'post',
            params: null,
            timeout: 5000,
            url: 'http://localhost/api/v2/chatroom',
        });
    });

    it('supported overridden builders', () => {
        const context = {
            spec,
            path: '/chatroom',
            method: 'post',
            options: {
                buildHeaders: () => ({ baz: 'qux' }),
            },
        };
        const req = null;
        expect(
            buildRequest(context, req, {
                body: {
                    foo: 'bar',
                },
            }),
        ).toEqual({
            adapter: null,
            data: {
                foo: 'bar',
            },
            headers: {
                baz: 'qux',
            },
            maxContentLength: -1,
            method: 'post',
            params: null,
            timeout: 5000,
            url: 'http://localhost/api/v2/chatroom',
        });
    });
});
