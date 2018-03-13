# nodule-openapi

Opinionated OpenAPI 2.0 (Swagger) Client


## Conventions

 -  Client code should be lightweight (e.g. few dependencies) and initialize quickly (read: synchronously)

    As such, OpenAPI specs are expected to be available locally (e.g. commited to version control) and
    loaded statically (i.e. without requiring promise resolution).

 -  Client interfaces should use fluent JavaScript.

    As of this writing, OpenAPI operations are exposed as functions named after `operationId`, scoped to an
    an object named after the operation's first `tag`. (Both operation fields are thus mandatory).

 -  HTTP requests are assumed to use camelCase for body parameters and snake_case for path and query string
    parameters; parameter names should be automatically converted from camelCase accordingly.


## Usage

In pseudo-code:

    const OpenAPI = require('./lib').default;
    const spec = require('./example/petstore-minimal.json');

    const client = OpenAPI(spec, 'petstore');
    client.pet.search().then(...).catch(...);
