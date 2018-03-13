import buildError, { OpenAPIError } from '../error';


describe('buildError', () => {
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
        }
    });
});
