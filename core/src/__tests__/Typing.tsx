import { __State, hookstate, ImmutableArray, State, StateMethods, StateProperties } from '../';

type TestExtends<T, U> = [T] extends [U] ? true : false
type TestNotExtends<T, U> = [T] extends [U] ? false : true
type TestEquals<T, U> = [T] extends [U] ? [U] extends [T] ? true : false : false
type TestNever<T> = TestEquals<T, never>
type TestAny<T> = TestEquals<T, any>

type TestFieldPresent<T, K extends keyof any> = TestAny<keyof T & K>
type TestFieldMissing<T, K extends keyof any> = TestNever<keyof T & K>

test('check assignability on typescript level', async () => {
    {
        // assign state to state of reduced value
        let a = hookstate<{ a: string, b?: string }>({ a: 'a', b: 'b' })
        let b: State<{ a: string }> = a;

        // ensure covariance
        true satisfies TestExtends<State<{ a: string, b?: string }>, State<{ a: string }>>;
        true satisfies TestNotExtends<State<{}>, State<{ a: string }>>;
        true satisfies TestNotExtends<State<{ a: string }>, State<{ a: string, b?: string }>>;
    }

    {
        //assign state with extension method to a state without
        interface Inf {
            m(): void,
        }
        let a = hookstate<{ a: string, b?: string }, Inf>({ a: 'a', b: 'b' }, () => ({
            onCreate: () => ({
                m: () => () => {}
            })
        }))
        let b: State<{ a: string }> = a;
    }

    {
        // array inference
        const a = hookstate([{ a: 1 } as const]);

        true satisfies TestEquals<typeof a, State<{ a: 1 }[]>>;
        true satisfies TestEquals<typeof a.value, ImmutableArray<{ a: 1 }>>;
        true satisfies TestEquals<(typeof a)[number], State<{ a: 1 }>>;
    }

    {
        // nullable array inference
        const a = hookstate(true ? [{ a: 1 } as const] : null);

        true satisfies TestEquals<typeof a, State<{ a: 1 }[] | null>>;
        true satisfies TestEquals<typeof a.value, ImmutableArray<{ a: 1 }> | null>;
        true satisfies TestEquals<(typeof a)[number], State<{ a: 1 }> | undefined>;
    }

    {
        // object inference
        const a = hookstate({ a: 1, b: 2 } as const);

        true satisfies TestEquals<typeof a, State<{ a: 1, b: 2 }>>;
        true satisfies TestEquals<typeof a.value, { a: 1, b: 2 }>;
        true satisfies TestFieldPresent<typeof a, 'a'>;
        true satisfies TestFieldPresent<typeof a, 'b'>;
        true satisfies TestFieldMissing<typeof a, 'c'>;
        true satisfies TestEquals<typeof a.a, State<1>>;
        true satisfies TestEquals<typeof a.b, State<2>>;
    }

    {
        // nullable object inference
        const a = hookstate(true ? { a: 1, b: 2 } as const : null);

        true satisfies TestEquals<typeof a, State<{ a: 1, b: 2 } | null>>;
        true satisfies TestEquals<typeof a.value, { a: 1, b: 2 } | null>;
        true satisfies TestFieldPresent<typeof a, 'a'>;
        true satisfies TestFieldPresent<typeof a, 'b'>;
        true satisfies TestFieldMissing<typeof a, 'c'>;
        true satisfies TestEquals<typeof a.a, State<1> | undefined>;
        true satisfies TestEquals<typeof a.b, State<2> | undefined>;
    }

    {
        // null inference
        const a = hookstate(null);

        true satisfies TestEquals<typeof a, State<null>>;
        true satisfies TestEquals<typeof a.value, null>;
        true satisfies TestFieldMissing<typeof a, 'a'>;
        true satisfies TestFieldMissing<typeof a, 'b'>;
        true satisfies TestFieldMissing<typeof a, 'c'>;
    }

    {
        // method removal on object
        const a = hookstate({ a: 1, b: () => {}, c: 3 } as const);

        true satisfies TestEquals<typeof a, State<{ a: 1, b: () => void, c: 3 }>>;
        true satisfies TestEquals<typeof a.value, { a: 1, b: () => void, c: 3 }>;
        true satisfies TestFieldPresent<typeof a, 'a'>;
        true satisfies TestFieldMissing<typeof a, 'b'>;
        true satisfies TestFieldPresent<typeof a, 'c'>;
        true satisfies TestEquals<typeof a.a, State<1>>;
        true satisfies TestEquals<typeof a.c, State<3>>;
    }

    {
        // method removal on nullable object
        const a = hookstate(true ? { a: 1, b: () => {}, c: 3 } as const : null);

        true satisfies TestEquals<typeof a, State<{ a: 1, b: () => void, c: 3 } | null>>;
        true satisfies TestEquals<typeof a.value, { a: 1, b: () => void, c: 3 } | null>;
        true satisfies TestFieldPresent<typeof a, 'a'>;
        true satisfies TestFieldMissing<typeof a, 'b'>;
        true satisfies TestFieldPresent<typeof a, 'c'>;
        true satisfies TestEquals<typeof a.a, State<1> | undefined>;
        true satisfies TestEquals<typeof a.c, State<3> | undefined>;
    }

    {
        // method removal on objects
        const a = hookstate(true ? { a: () => {}, b: 2, c: 3 } as const : { a: 1, b: 2, c: () => {} } as const);

        true satisfies TestEquals<typeof a, State<{ a: () => void, b: 2, c: 3 } | { a: 1, b: 2, c: () => void }>>;
        true satisfies TestEquals<typeof a.value, { a: () => void, b: 2, c: 3 } | { a: 1, b: 2, c: () => void }>;
        true satisfies TestFieldMissing<typeof a, 'a'>;
        true satisfies TestFieldPresent<typeof a, 'b'>;
        true satisfies TestFieldMissing<typeof a, 'c'>;
        true satisfies TestEquals<typeof a.b, State<2>>;
    }

    {
        // method removal on nullable objects
        const a = hookstate(true ? true ? { a: () => {}, b: 2, c: 3 } as const : { a: 1, b: 2, c: () => {} } as const : null);

        true satisfies TestEquals<typeof a, State<{ a: () => void, b: 2, c: 3 } | { a: 1, b: 2, c: () => void } | null>>;
        true satisfies TestEquals<typeof a.value, { a: () => void, b: 2, c: 3 } | { a: 1, b: 2, c: () => void } | null>;
        true satisfies TestFieldMissing<typeof a, 'a'>;
        true satisfies TestFieldPresent<typeof a, 'b'>;
        true satisfies TestFieldMissing<typeof a, 'c'>;
        true satisfies TestEquals<typeof a.b, State<2> | undefined>;
    }
});
