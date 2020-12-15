/* Validate request arguments.
 */
import { get, isNil, omit } from 'lodash';

import { OpenAPIError } from './error';
import nameFor from './naming';

function isQueryOrPathParameter(parameter) {
    return parameter.in === 'path' || parameter.in === 'query';
}

function buildRequiredParameters(operation, filterFunc, options) {
    return get(operation, 'parameters', []).filter(
        filterFunc,
    ).reduce(
        (obj, parameter) => Object.assign(obj, {
            [nameFor(parameter.name, parameter.in, false, options)]: parameter.required,
        }),
        {},
    );
}

function validateQueryAndPathParameters(operation, operationName, args, options) {
    const parameters = buildRequiredParameters(operation, isQueryOrPathParameter, options);
    const queryAndPathArgs = omit(args, 'body');

    // there should be no unexpected arguments
    Object.keys(queryAndPathArgs).forEach((name) => {
        if (!(name in parameters)) {
            const message = `Unsupported argument: "${name}" passed to: "${operationName}"`;
            throw new OpenAPIError(message);
        }
    });

    // there should be no missing required arguments
    Object.keys(parameters).forEach((name) => {
        if (parameters[name] && isNil(queryAndPathArgs[name])) {
            const message = `Required argument: "${name}" not passed to: "${operationName}"`;
            throw new OpenAPIError(message);
        }
    });
}

export default ({ spec, method, path, options }) => (req, operationName, args) => {
    const operation = spec.paths[path][method];

    validateQueryAndPathParameters(operation, operationName, args, options);
    // NB: body validation requires deeper work

    return true;
};
