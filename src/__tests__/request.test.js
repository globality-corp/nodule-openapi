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
            retries: 0,
            proxyRetries: 0,
            proxyRetriesDelay: 1000,
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
                retries: 5,
                proxyRetries: 6,
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
            retries: 5,
            proxyRetries: 6,
            proxyRetriesDelay: 1000,
            timeout: 5000,
            url: 'http://localhost/api/v2/chatroom',
        });
    });

    it('Make sure we are not passing the same argument as both query parameter and body argument', () => {
        const context = {
            spec,
            path: '/chatroom/{chatroom_id}',
            method: 'get',
        };
        const req = null;
        expect(
            buildRequest(context, req, {
                chatroomId: 'bar',
                projectId: 'baz',
            }),
        ).toEqual({
            adapter: null,
            data: null,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            maxContentLength: -1,
            method: 'get',
            params: {
                project_id: 'baz',
            },
            retries: 0,
            timeout: 5000,
            proxyRetries: 0,
            proxyRetriesDelay: 1000,
            url: 'http://localhost/api/v2/chatroom/bar',
        });
    });
});
