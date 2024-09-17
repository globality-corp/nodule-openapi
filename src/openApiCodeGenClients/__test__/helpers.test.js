import { jest } from '@jest/globals';

jest.unstable_mockModule('@globality/nodule-config', () => ({
    getMetadata: () => ({
        name: 'my-service',
    }),
    getContainer: () => { },
    getConfig: () => { }
}));

const { createHeaders } = await import('../helpers.js');

describe('createHeaders function', () => {
    it('should merge initialHeaders with options.additionalHeaders', () => {
        const startTime = new Date('2023-08-18T10:15:03.052Z');
        const req = {
            id: 'request-id',
            locals: {
                user: {
                    id: 'user-id',
                },
            },
            _startTime: startTime,
        };

        const context = {
            spec: {},
            path: '/my-api',
            method: 'post',
            options: {
                retries: 5,
            },
        };
        const options = {
            additionalHeaders: {
                'X-Request-My-Specific-Header': 'id-123',
            },
        };

        const expectedFinalHeaders = {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Request-Service': 'my-service',
            'X-Request-Started-At': '2023-08-18T10:15:03.052Z',
            'X-Request-Id': 'request-id',
            'X-Request-My-Specific-Header': 'id-123',
            'X-Request-User': 'user-id',
        };

        const result = createHeaders(req, context, options);

        expect(result).toEqual(expectedFinalHeaders);
    });

    it('should handle the absence of additionalHeaders property on options', () => {
        const startTime = new Date('2023-08-18T10:15:03.052Z');
        const req = {
            id: 'request-id',
            locals: {
                user: {
                    id: 'user-id',
                },
            },
            _startTime: startTime,
        };

        const context = {
            spec: {},
            path: '/my-api',
            method: 'post',
            options: {
                retries: 5,
            },
        };
        const options = {}; // No additionalHeaders here

        const expectedHeadersWithoutAdditionalHeaders = {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Request-Service': 'my-service',
            'X-Request-Started-At': '2023-08-18T10:15:03.052Z',
            'X-Request-Id': 'request-id',
            'X-Request-User': 'user-id',
        };

        const result = createHeaders(req, context, options);

        expect(result).toEqual(expectedHeadersWithoutAdditionalHeaders);
    });
});
