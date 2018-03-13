/* Client factory.
 *
 * Generate an OpenAPI client for a spec.
 */
import { set } from 'lodash';

import { operationNameFor } from './naming';
import CallableOperation from './operation';


/* Generate a mapping from (dotted) operation names to callable operations.
 */
export default function createClient(spec, serviceName, options = {}) {
    const operations = {};

    // for each path
    const { paths } = spec;
    Object.keys(paths).forEach((path) => {
        // for each method
        const methods = paths[path];
        Object.keys(methods).forEach((method) => {

            // for each tag
            const operation = paths[path][method];
            operation.tags.forEach((tag) => {
                const { operationId } = operation;
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
                    CallableOperation(context, serviceName, operationName),
                );
            });
        });
    });

    return operations;
}
