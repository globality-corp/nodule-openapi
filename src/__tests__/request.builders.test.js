import spec from './example.json';
import {
    buildData,
    buildHeaders,
    buildMethod,
    buildParams,
    buildUrl,
    expandPath,
} from '../request';


describe('buildData', () => {
    it('returns verbatim for non-get', () => {
        const context = {};
        const req = null;
        expect(
            buildData(context, req, {
                foo: 'bar',
            }),
        ).toEqual({
            foo: 'bar',
        });
    });
    it('returns null for get', () => {
        const context = {
            method: 'get',
        };
        const req = null;
        expect(
            buildData(context, req, {
                foo: 'bar',
            }),
        ).toEqual(
            null,
        );
    });
});


describe('buildHeaders', () => {
    it('returns standard headers', () => {
        const context = {};
        expect(
            buildHeaders(context),
        ).toEqual({
            'Content-Type': 'application/json; charset=utf-8',
        });
    });
});


describe('buildMethod', () => {
    it('returns standard headers', () => {
        const context = {
            method: 'get',
        };
        expect(
            buildMethod(context),
        ).toEqual(
            'get',
        );
    });
});


describe('buildParams', () => {
    it('returns null for non-get', () => {
        const context = {};
        expect(
            buildParams(context),
        ).toEqual(
            null,
        );
    });

    it('returns verbatim for get', () => {
        const context = {
            method: 'get',
        };
        const req = null;
        expect(
            buildParams(context, req, {}),
        ).toEqual({
        });
    });
});


describe('buildUrl', () => {
    it('construct a url', () => {
        const context = {
            spec,
            path: '/foo',
        };
        expect(
            buildUrl(context),
        ).toEqual(
            'http://localhost/api/v2/foo',
        );
    });
    it('accepts an override base url', () => {
        const context = {
            spec,
            options: {
                baseUrl: 'https://example.com',
            },
            path: '/foo',
        };
        expect(
            buildUrl(context),
        ).toEqual(
            'https://example.com/api/v2/foo',
        );
    });
});


describe('expandPath', () => {
    const context = {};

    it('return a path as-is with no args', () => {
        expect(
            expandPath(context, '/foo/{bar}', null),
        ).toEqual(
            '/foo/{bar}',
        );
    });

    it('return a path as-is with empty args', () => {
        expect(
            expandPath(context, '/foo/{bar}', {}),
        ).toEqual(
            '/foo/{bar}',
        );
    });

    it('return a path as-is with wrong args', () => {
        expect(
            expandPath(context, '/foo/{bar}', { baz: 'qux' }),
        ).toEqual(
            '/foo/{bar}',
        );
    });

    it('return an expanded path with correct args', () => {
        expect(
            expandPath(context, '/foo/{bar}', { bar: 'qux' }),
        ).toEqual(
            '/foo/qux',
        );
    });

    it('return an expanded path with path args', () => {
        expect(
            expandPath(context, '/foo/{bar}', { bar: 'qux/quux' }),
        ).toEqual(
            '/foo/qux/quux',
        );
    });
});