import { isFunction, set, get } from 'lodash';
import { getContainer } from '@globality/nodule-config';
import { Handler } from 'swagger-object-validator';

import { OpenAPIError } from '../error';


export class SchemaMismatchError extends Error {
    constructor(name, operationId) {
        super(`Request to ${name}.${operationId} does not match schema`);
        Error.captureStackTrace(this, this.constructor);
    }
}

/* Mock a client (OpenAPI) response.
 */
export function mockResponse(name, operationId, data, headers = { 'content-type': 'application/json' }) {
    const obj = {};

    async function mockCall(req) {
        const { clients } = getContainer();
        const service = get(clients, name);
        if (service) {
            const { context } = get(service, operationId);

            if (req.data) {
                // if we have a request body, validate it against the appropriate
                // swagger spec
                const body = JSON.parse(req.data);
                const validator = new Handler(context.spec);
                const { parameters } = context.spec.paths[context.path][context.method];
                const bodyParam = parameters.filter(param => param.in === 'body');
                if (!bodyParam) {
                    // eslint-disable-next-line no-console
                    console.warn(`Request to ${name}.${operationId} has unexpected HTTP body`);
                    throw new SchemaMismatchError(name, operationId);
                }

                try {
                    const validation = await validator.validateModel(body, bodyParam[0].schema);
                    if (validation.errors.length) {
                        // eslint-disable-next-line no-console
                        console.warn(
                            `Request to ${name}.${operationId} does not match schema\n`,
                            validation.humanReadable(),
                            'Called with\n',
                            body,
                        );
                        // throw new SchemaMismatchError(name, operationId);
                    }
                } catch (exc) {
                    // eslint-disable-next-line no-console
                    console.warn(
                        `Could not validate schema for ${name}.${operationId}\n`, exc,
                    );
                }
            }
        }
        return {
            data: isFunction(data) ? data(req.params || JSON.parse(req.data || null), req.url)
                : data,
            headers,
        };
    }
    set(obj, `clients.mock.${name}.${operationId}`, jest.fn(mockCall));
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
