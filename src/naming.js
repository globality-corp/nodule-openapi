/* Naming conventions.
 */
import { camelCase, get, snakeCase } from 'lodash-es';

/* Generate a suitable dotted operation name.
 */
export function operationNameFor(subject, operationId) {
    const isRelation = operationId.match('(.*_for)_(.*)');

    if (isRelation) {
        // use: object.operation.subject
        const [_, operation, object] = isRelation; // eslint-disable-line no-unused-vars
        return `${camelCase(object)}.${camelCase(operation)}.${camelCase(subject)}`;
    }
    // use: subject.operation
    return `${camelCase(subject)}.${camelCase(operationId)}`;
}

/* Define naming convention for path parameters.
 *
 * The `fromUser` argument indicates whether to convert from user input to swagger
 * or vice versa.
 */
export function pathParameterNameFor(value, fromUser) {
    return fromUser ? snakeCase(value) : camelCase(value);
}

/* Define naming convention for query parameters.
 *
 * The `fromUser` argument indicates whether to convert from user input to swagger
 * or vice versa.
 */
export function queryParameterNameFor(value, fromUser) {
    return fromUser ? snakeCase(value) : camelCase(value);
}

/* Preserve parameter name
 *
 */
const preserveParameterName = (value) => value;

const DEFAULT_NAMING = {
    path: pathParameterNameFor,
    query: queryParameterNameFor,
};

export const NAMING_OPTION = {
    preserveParameterName,
    pathParameterNameFor,
    queryParameterNameFor,
};

/* Resolve the name for something.
 */
export default (name, type, fromUser, options) => {
    const overrides = get(options, 'naming', {});
    const nameFor = get(overrides, type, DEFAULT_NAMING[type]);
    return nameFor ? nameFor(name, fromUser) : name;
};
