import buildResponse from '../response.js';

describe('buildRequest', () => {
    it('uses default builder', () => {
        expect(
            buildResponse()({
                data: {
                    foo: 'bar',
                },
            }),
        ).toEqual({
            foo: 'bar',
        });
    });

    it('supports overridden builders', () => {
        const context = {
            options: {
                buildResponse: (response, _, req) => ({ id: req.id }),
            },
        };
        expect(
            buildResponse(context)(
                {
                    data: {
                        foo: 'bar',
                    },
                },
                context,
                {
                    id: 'id',
                },
            ),
        ).toEqual({
            id: 'id',
        });
    });
});
