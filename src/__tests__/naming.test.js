import {
    operationNameFor,
    pathParameterNameFor,
    queryParameterNameFor,
} from '../naming';


describe('operationNameFor', () => {
    it('converts to camelCase', () => {
        expect(
            operationNameFor('subject_name', 'relation_name'),
        ).toEqual(
            'subjectName.relationName',
        );
    });
    it('specializes relation operations', () => {
        expect(
            operationNameFor('subject_name', 'relation_for_object_name'),
        ).toEqual(
            'objectName.relationFor.subjectName',
        );
    });
});


describe('pathParameterNameFor', () => {
    it('converts to camelCase', () => {
        expect(
            pathParameterNameFor('foo_bar', false),
        ).toEqual(
            'fooBar',
        );
    });
    it('preserves camelCase', () => {
        expect(
            pathParameterNameFor('fooBar', false),
        ).toEqual(
            'fooBar',
        );
    });
    it('converts to snake_case', () => {
        expect(
            pathParameterNameFor('fooBar', true),
        ).toEqual(
            'foo_bar',
        );
    });
    it('preserves snake_case', () => {
        expect(
            pathParameterNameFor('foo_bar', true),
        ).toEqual(
            'foo_bar',
        );
    });
});


describe('queryParameterNameFor', () => {
    it('converts to camelCase', () => {
        expect(
            queryParameterNameFor('foo_bar', false),
        ).toEqual(
            'fooBar',
        );
    });
    it('preserves camelCase', () => {
        expect(
            queryParameterNameFor('fooBar', false),
        ).toEqual(
            'fooBar',
        );
    });
    it('converts to snake_case', () => {
        expect(
            queryParameterNameFor('fooBar', true),
        ).toEqual(
            'foo_bar',
        );
    });
    it('preserves snake_case', () => {
        expect(
            queryParameterNameFor('foo_bar', true),
        ).toEqual(
            'foo_bar',
        );
    });
});
