import { extendHeadersFromOptions } from '../operation.js';

describe('extendHeadersFromOptions function', () => {

    it('should merge request.headers with options.additionalHeaders', () => {
        const request = {
            url: 'https://example.com/api',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer someToken',
            },
        };

        const options = {
            additionalHeaders: {
                'X-Custom-Header': 'CustomValue',
                'X-Another-Header': 'AnotherValue',
            },
        };

        const expectedHeaders = {
            'Content-Type': 'application/json',
            Authorization: 'Bearer someToken',
            'X-Custom-Header': 'CustomValue',
            'X-Another-Header': 'AnotherValue',
        };


        const { headers } = extendHeadersFromOptions(request, options);
        expect(headers).toEqual(expectedHeaders);
    });

    it('should return the same request if options.additionalHeaders does not exist', () => {
        const request = {
            url: 'https://example.com/api',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer someToken',
            },
        };

        const options = {};

        const result = extendHeadersFromOptions(request, options);
        expect(result).toEqual(request);
    });

    it('should return the same request if options is not provided', () => {
        const request = {
            url: 'https://example.com/api',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer someToken',
            },
        };

        const result = extendHeadersFromOptions(request);
        expect(result).toEqual(request);
    });
});
