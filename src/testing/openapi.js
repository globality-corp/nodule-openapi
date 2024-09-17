/* eslint-disable no-undef */
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import { isFunction, set } from 'lodash-es';

import { OpenAPIError } from '../error.js';

/* Mock a client (OpenAPI) response.
 */
export function mockResponse(name, operationId, data, headers = { 'content-type': 'application/json' }) {
    const obj = {};

    set(obj, `clients.mock.${name}.${operationId}`, jest.fn(async (req) => ({
        data: isFunction(data) ? data(req.params || JSON.parse(req.data || null), req.url) : data,
        headers,
    })));

    return obj;
}

export function mockResponseVitest(name, operationId, data, headers = { 'content-type': 'application/json' }) {
    const obj = {};

    // @ts-ignore
    set(obj, `clients.mock.${name}.${operationId}`, vitest.fn(async (req) => ({
        data: isFunction(data) ? data(req.params || JSON.parse(req.data || null), req.url) : data,
        headers,
    })));

    return obj;
}

/* Mock a client (OpenAPI) error.
 */
export function mockError(name, operationId, message, code, data = null) {
    const obj = {};

    set(obj, `clients.mock.${name}.${operationId}`, jest.fn(async () => {
        throw new OpenAPIError(message, code, data);
    }));

    return obj;
}

export function mockErrorVitest(name, operationId, message, code, data = null) {
    const obj = {};

    // @ts-ignore
    set(obj, `clients.mock.${name}.${operationId}`, vitest.fn(async () => {
        throw new OpenAPIError(message, code, data);
    }));

    return obj;
}
