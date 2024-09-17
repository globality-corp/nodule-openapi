// @ts-nocheck
import buildError, { OpenAPIError } from '../error.js';

describe('buildError', () => {

    it('is an error', () => {
        expect(new OpenAPIError('message') instanceof Error).toBe(true);
    });

    it('returns response data', () => {
        try {
            buildError()({
                response: {
                    data: {
                        code: 'error',
                        foo: 'bar',
                    },
                },
            });
            throw new Error('no error thrown');
        } catch (error) {
            expect(error.code).toEqual('error');
            expect(error.data).toEqual({
                code: 'error',
                foo: 'bar',
            });
        }
    });

    it('returns response status', () => {
        try {
            buildError()({
                response: {
                    status: 404,
                },
            });
            throw new Error('no error thrown');
        } catch (error) {
            expect(error.code).toEqual(404);
            expect(error.data).toEqual(null);
        }
    });

    it('returns error code', () => {
        try {
            buildError()({
                code: 'error',
            });
            throw new Error('no error thrown');
        } catch (error) {
            expect(error.code).toEqual('error');
            expect(error.data).toEqual(null);
            expect(error.headers).toEqual(null);
        }
    });

    it('supports overridden builder', () => {
        const context = {
            options: {
                buildError: (error, _, req) => {
                    throw new OpenAPIError(req.id, 200);
                },
            },
        };
        try {
            buildError(context)(
                {
                    data: {
                        foo: 'bar',
                    },
                },
                context,
                {
                    id: 'id',
                },
            );
            throw new Error('no error thrown');
        } catch (error) {
            expect(error.code).toEqual(200);
            expect(error.message).toEqual('id');
            expect(error.headers).toEqual(null);
        }
    });

    it('return error with headers', () => {
        try {
            buildError()({
                request: {
                    getHeaders: () => ({
                        'x-foo': 100,
                        'x-bar': 200,
                    }),
                },
            });
            throw new Error('no error thrown');
        } catch (error) {
            expect(error.code).toEqual(null);
            expect(error.data).toEqual(null);
            expect(error.headers).toEqual(expect.objectContaining({
                'x-foo': 100,
                'x-bar': 200,
            }));
        }
    });

    it('prunes authorization information from headers', () => {
        try {
            buildError()({
                request: {
                    getHeaders: () => ({
                        'x-foo': 100,
                        'x-bar': 200,
                        Authorization: 'baz',
                        aUthOriZation: 'baz',
                    }),
                },
            });
            throw new Error('no error thrown');
        } catch (error) {
            expect(error.headers).toEqual(expect.objectContaining({
                'x-foo': 100,
                'x-bar': 200,
            }));
        }
    });
});
