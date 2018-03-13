/* Opinonated OpenAPI 2.0 (Swagger) Client.
 *
 * Design goals:
 *
 *  -  Synchronous initialization; asynchronous invocation.
 *  -  Simple and obvious implementation by default; extensible by design.
 */
import Client from './client';


/* Create a client for a spec and an optional set of options
 *
 * Usage:
 *
 *    import OpenAPI from 'modules/openapi';
 *    const client = OpenAPI(spec, 'somename');
 *    client.subject.operations(args);
 *
 * `spec`: An OpenAPI JSON specificiation. Assuumed to be valid.
 * `name`: A human-friendly name for this API.
 * `options`: A dictionary of options.
 */
export default Client;
