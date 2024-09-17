import spec from './example.json';
import Validator from '../validation.js';


describe('validation', () => {
    const req = {};

    it('does not raise an error on valid input', () => {
        const method = 'get';
        const path = '/chatroom';
        const validate = Validator({ spec, method, path });

        expect(validate(req, 'chatroom.search', {})).toBe(true);
    });

    it('enforces that input parameters are expected', () => {
        const method = 'get';
        const path = '/chatroom';
        const validate = Validator({ spec, method, path });

        expect(() => validate(req, 'chatroom.search', { foo: 'bar' })).toThrow(
            'Unsupported argument: "foo" passed to: "chatroom.search"',
        );
    });

    it('enforces that required parameters are inputed', () => {
        const method = 'get';
        const path = '/chatroom/{chatroom_id}';
        const validate = Validator({ spec, method, path });

        expect(() => validate(req, 'chatroom.retrieve', {})).toThrow(
            'Required argument: "chatroomId" not passed to: "chatroom.retrieve"',
        );
    });

    it('enforces that required parameters are non-null', () => {
        const method = 'get';
        const path = '/chatroom/{chatroom_id}';
        const validate = Validator({ spec, method, path });

        expect(() => validate(req, 'chatroom.retrieve', { chatroomId: null })).toThrow(
            'Required argument: "chatroomId" not passed to: "chatroom.retrieve"',
        );
    });

    it('enforces that required falsey parameters pass', () => {
        const method = 'get';
        const path = '/chatroom/{chatroom_id}';
        const validate = Validator({ spec, method, path });

        expect(validate(req, 'chatroom.retrieve', { chatroomId: 0 })).toBe(true);
    });
});
