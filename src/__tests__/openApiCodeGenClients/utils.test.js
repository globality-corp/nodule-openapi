import { capitalizeFirstLetter, convertOperationIdToOperationName, convertResourceNameToBaseTags, doTagsMatch, findAllOperationIds, findAllOperationIdsUsingBaseTag, isMutationOperation } from '../../openApiCodeGenClients/utils.js';
import exampleV3Spec from './exampleSpec.v3.json';

describe('isMutationOperation', () => {
    it.each([
        ['get', false],
        ['Get', false],
        ['post', true],
        ['Post', true],
        ['POST', true],
        ['put', true],
        ['patch', true],
        ['delete', true],
    ])('correctly identifies mutation', (requestMethod, expectedOutput) => {
        const output = isMutationOperation(requestMethod);
        expect(output).toEqual(expectedOutput);
    });
});

describe('convertResourceNameToBaseTags', () => {
    it('happy path 1', () => {
        class MyResourceApi { }

        const output = convertResourceNameToBaseTags(MyResourceApi);
        expect(output).toEqual(['my', 'resource']);
    });

    it('happy path 2', () => {
        class FastCarsApi { }

        const output = convertResourceNameToBaseTags(FastCarsApi);
        expect(output).toEqual(['fast', 'cars']);
    });

    it('happy path 3', () => {
        class GoogleMapsApi { }

        const output = convertResourceNameToBaseTags(GoogleMapsApi);
        expect(output).toEqual(['google', 'maps']);
    });

    it('happy path 4', () => {
        class GoogleMaps { }

        const output = convertResourceNameToBaseTags(GoogleMaps);
        expect(output).toEqual(['google', 'maps']);
    });
});

describe('doTagsMatch', () => {
    it.each([
        [['public', 'v1'], ['public/v1'], true],
        [['public', 'v1'], ['Public/v1'], true],
        [['public', 'v1'], ['/landing_page', 'public/v1'], true],
        [['public', 'v1'], ['/landing_page', 'public/v2'], false],
        [['landing', 'page'], ['/landing_page', 'public/v2'], true],
        [['cheesy', 'pizza'], ['cheesy_pizza'], true],
    ])('correctly matches tags', (baseTags, tags, expectedOutput) => {
        const output = doTagsMatch(baseTags, tags);
        expect(output).toEqual(expectedOutput);
    });
});

describe('findAllOperationIdsUsingBaseTag', () => {
    it('correctly finds all operation ids', () => {
        const baseTags = ['private', 'v1'];
        const output = findAllOperationIdsUsingBaseTag(baseTags, exampleV3Spec);

        const expectedOutput = [{ operationId: 'partial_api_private_v1_cheesy_pizza_get', path: '/api/private/v1/cheesy_pizza', requestMethod: 'get' }];
        expect(output).toEqual(expectedOutput);
    });

    it('correctly finds the `public v1` operations', () => {
        const baseTags = ['public', 'v1'];
        const output = findAllOperationIdsUsingBaseTag(baseTags, exampleV3Spec);

        const expectedOutput = [{ operationId: 'cheesy_pizza_retrieve', path: 'api/public/v1/cheesy_pizza/{cheesy_pizza_id}', requestMethod: 'get' }];
        expect(output).toEqual(expectedOutput);
    });

    it('finds no matches', () => {
        const baseTags = ['public', 'v2'];
        const output = findAllOperationIdsUsingBaseTag(baseTags, exampleV3Spec);
        expect(output).toEqual([]);
    });
});

describe('findAllOperationIds', () => {
    it('correctly finds all operation ids', () => {
        class PrivateV1Api { }

        const output = findAllOperationIds(PrivateV1Api, exampleV3Spec);
        const expectedOutput = [{ operationId: 'partial_api_private_v1_cheesy_pizza_get', path: '/api/private/v1/cheesy_pizza', requestMethod: 'get' }];
        expect(output).toEqual(expectedOutput);
    });
});

describe('capitalizeFirstLetter', () => {
    it.each([
        ['public', 'Public'],
        ['private', 'Private'],
    ])('correctly capitalizes first letter', (input, expectedOutput) => {
        const output = capitalizeFirstLetter(input);
        expect(output).toEqual(expectedOutput);
    });
});

describe('convertOperationIdToOperationName', () => {
    it.each([
        ['partial_api_public_v1_cheesy_pizza_get', 'partialApiPublicV1CheesyPizzaGet'],
        ['downloadLink', 'downloadLink'],
    ])('correctly converts operation id to operation name', (input, expectedOutput) => {
        const output = convertOperationIdToOperationName(input);
        expect(output).toEqual(expectedOutput);
    });
});
