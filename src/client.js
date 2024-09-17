/* Client factory.
 *
 * Generate an OpenAPI client for a spec.
 */
import { set } from 'lodash';

import { operationNameFor } from './naming.js';
import CallableOperation from './operation.js';


/* Generate a mapping from (dotted) operation names to callable operations.
 *
 * `spec`: An OpenAPI JSON specificiation. Assuumed to be valid.
 * `name`: A human-friendly name for this API.
 * `options`: A dictionary of options.
 */
export default function createClient(spec, name, options = {}) {
    const operations = {};

    const { paths } = spec;
    if (!paths) {
        throw new Error(`OpenAPI spec for ${name} must define paths`);
    }

    // for each path
    Object.keys(paths).forEach((path) => {
        const methods = paths[path];

        // for each method
        Object.keys(methods).forEach((method) => {

            // for each tag
            const operation = paths[path][method];
            if (!operation.tags || !operation.tags.length) {
                throw new Error(`OpenAPI spec for ${name} must define at least one tag for ${method} ${path}`);
            }

            operation.tags.forEach((tag) => {
                const { operationId } = operation;
                if (!operationId) {
                    throw new Error(`OpenAPI operation for ${name} must define an operationId for ${method} ${path}`);
                }

                const operationName = operationNameFor(tag, operationId);
                const context = {
                    spec,
                    options,
                    path,
                    method,
                    operationId,
                };
                // create a callable operation
                set(
                    operations,
                    operationName,
                    CallableOperation(context, name, operationName),
                );
            });
        });
    });

    return operations;
}
