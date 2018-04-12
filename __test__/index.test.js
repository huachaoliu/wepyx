/* global test, expect, afterEach */
import wepyx, { _clean, connect } from '../src/index';

afterEach(() => {
  _clean();
});

test('mode must be union', () => {
  expect(() => {
    wepyx.model({
      namespace: 'n',
    });
    wepyx.model({
      namespace: 'n',
    });
  }).toThrowError(/model\[namespace=\w+\] must be union/);
});

test('mutations', () => {
  wepyx.model({
    namespace: 'n',
    state: {
      count: 0,
    },
    mutations: {
      add(state, payload) {
        state.count += payload;
      },
    },
  });
  wepyx.start();
  wepyx.dispatcher.n.add(1);
  expect(wepyx._store.getState().n).toEqual({ count: 1 });
});

test('actions', () => {
  wepyx.model({
    namespace: 'n',
    state: {
      count: 0,
    },
    mutations: {
      add(state, payload) {
        state.count += payload;
      },
    },
    actions: {
      add(params) {
        return params * 10;
      },
    },
  });
  wepyx.start();
  wepyx.dispatcher.n.add(1);
  expect(wepyx._store.getState().n).toEqual({ count: 10 });
});

test('async actions', () => {
  wepyx.model({
    namespace: 'n',
    state: {
      count: 0,
    },
    mutations: {
      add(state, payload) {
        state.count += payload;
      },
    },
    actions: {
      asyncAdd(params) {
        return async ({ dispatcher, getState, state }) => {
          expect(getState()).toEqual({ n: { count: 0 } });
          expect(state).toEqual({ count: 0 });
          const data = await new Promise(resolve => {
            setTimeout(() => {
              resolve(params);
            }, 100);
          });
          dispatcher.n.add(data);
          return 'done';
        };
      },
    },
  });
  wepyx.start();
  expect.assertions(4);
  return wepyx.dispatcher.n.asyncAdd(10).then(result => {
    expect(result).toBe('done');
    expect(wepyx._store.getState().n).toEqual({ count: 10 });
  });
});

test('action meta', () => {
  wepyx.model({
    namespace: 'n',
    state: {
      count: 0,
    },
    mutations: {
      add(state, payload) {
        state.count += payload;
      },
    },
    actions: {
      n() {},
      asyncAdd() {
        return async ({ dispatcher }) => {
          expect(dispatcher.asyncAdd).toBeTruthy();
          expect(dispatcher.add).toBeTruthy();
          expect(dispatcher.n.asyncAdd).toBeTruthy();
          expect(dispatcher.n.add).toBeTruthy();
          expect(dispatcher.n).toBeInstanceOf(Object);
        };
      },
    },
  });
  wepyx.start();
  expect.assertions(5);
  return wepyx.dispatcher.n.asyncAdd();
});

test('init', () => {
  expect(() => {
    wepyx.init({
      extraMiddlewares: {},
    });
  }).toThrowError(/extraMiddlewares type must be Array/);
});

test('setups', done => {
  wepyx.model({
    namespace: 'n',
    mutations: {
      add() {},
    },
    setups: {
      f({ take, dispatcher }) {
        expect(take).toBeInstanceOf(Object);
        expect(dispatcher).toBeInstanceOf(Object);
        expect(dispatcher.add).toBeInstanceOf(Function);
        done();
      },
    },
  });
  wepyx.start();
});

test('setups func', done => {
  wepyx.model({
    namespace: 'n',
    setups: () => {
      done();
    },
  });
  wepyx.start();
});

test('connect', () => {
  const maps = {};
  connect(maps);
  expect(maps.dispatcher).toBeTruthy();
});

test('take', done => {
  wepyx.model({
    namespace: 'n',
    mutations: {
      add(state, payload) {
        state.count += payload;
      },
    },
    actions: {
      asyncAdd() {
        return async ({ take }) => {
          const data = await take('n/event');
          expect(data).toEqual(1);
          done();
        };
      },
    },
  });
  wepyx.start();
  wepyx.dispatcher.n.asyncAdd();
  wepyx._store.dispatch({
    type: 'n/event',
    payload: 1,
  });
});

test('action after', done => {
  wepyx.model({
    namespace: 'n',
    state: {
      count: 0,
    },
    mutations: {
      add(state, payload) {
        state.count += payload;
      },
    },
    actions: {
      asyncAdd() {
        return async ({ take, getState }) => {
          expect(getState().n).toEqual({ count: 0 });
          const data = await take('add:after');
          expect(getState().n).toEqual({ count: 1 });
          done();
        };
      },
    },
  });
  wepyx.start();
  wepyx.dispatcher.n.asyncAdd();
  wepyx._store.dispatch({
    type: 'n/add',
    payload: 1,
  });
});
