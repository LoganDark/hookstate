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

    {
        type NarrowTo<To, From, Keys extends keyof To & keyof From> = {
            [K in (keyof To & Keys) | Exclude<keyof From, Keys>]:
                K extends keyof To & Keys ? To[K] :
                K extends Exclude<keyof From, Keys> ? From[K] :
                never
        };

        type NarrowedStateMethods<To, From, E = {}> =
            NarrowTo<
                StateMethods<From, E>,
                StateMethods<To, E>,
                'promise' | 'set' | 'merge' | 'nested' | 'ornull'
            >;

        type NarrowedState<To, From, E = {}> = __State<From, E> & NarrowedStateMethods<To, From, E> & E & StateProperties<To, E>;

        // oh, look what I can do
        const isNonNullable = <From, To extends From, E = {}>(state: NarrowedState<To, From, E>): state is NarrowedState<NonNullable<To>, From, E> => state.ornull !== null

        const a = hookstate(true ? { a: true ? { b: true ? 2 : null } as const : null } as const : null);

        true satisfies TestEquals<typeof a, State<{ a: { b: 2 | null } | null } | null>>;
        true satisfies TestEquals<typeof a.value, { a: { b: 2 | null } | null } | null>;
        true satisfies TestFieldPresent<typeof a, 'a'>;
        true satisfies TestFieldMissing<typeof a, 'b'>;
        true satisfies TestFieldMissing<typeof a, 'c'>;
        true satisfies TestEquals<typeof a.a, State<{ b: 2 | null } | null> | undefined>;

        if (isNonNullable(a)) {
            const b = a;

            true satisfies TestEquals<typeof b.value, { a: { b: 2 | null } | null }>;
            true satisfies TestEquals<typeof b.a, State<{ b: 2 | null } | null>>;
            true satisfies TestEquals<typeof b.a.b, State<2 | null> | undefined>;

            const ba = b.a;

            true satisfies TestEquals<typeof ba, State<{ b: 2 | null } | null>>;
            true satisfies TestEquals<typeof ba.value, { b: 2 | null } | null>;
            true satisfies TestFieldPresent<typeof ba, 'b'>;
            true satisfies TestEquals<typeof ba.b, State<2 | null> | undefined>;

            if (isNonNullable(ba)) {
                const ca = ba;

                true satisfies TestEquals<typeof ca.value, { b: 2 | null }>;
                true satisfies TestFieldMissing<typeof ca, 'a'>;
                true satisfies TestFieldPresent<typeof ca, 'b'>;
                true satisfies TestFieldMissing<typeof ca, 'c'>;
                true satisfies TestEquals<typeof ca.b, State<2 | null>>;

                const cab = ca.b;

                true satisfies TestEquals<typeof cab, State<2 | null>>;
                true satisfies TestEquals<typeof cab.value, 2 | null>;
                true satisfies TestFieldMissing<typeof cab, 'a'>;
                true satisfies TestFieldMissing<typeof cab, 'b'>;
                true satisfies TestFieldMissing<typeof cab, 'c'>;

                if (isNonNullable(cab)) {
                    const dab = cab;

                    true satisfies TestEquals<typeof dab.value, 2>;
                    true satisfies TestFieldMissing<typeof dab, 'a'>;
                    true satisfies TestFieldMissing<typeof dab, 'b'>;
                    true satisfies TestFieldMissing<typeof dab, 'c'>;
                }
            }
        }
    }
});
