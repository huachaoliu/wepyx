# wepyx
[![NPM version](https://img.shields.io/npm/v/wepyx.svg?style=flat)](https://npmjs.org/package/wepyx)
[![Build Status](https://travis-ci.org/tolerance-go/wepyx.svg?branch=master)](https://travis-ci.org/tolerance-go/wepyx)
[![Coverage Status](https://coveralls.io/repos/github/tolerance-go/wepyx/badge.svg?branch=master)](https://coveralls.io/github/tolerance-go/wepyx?branch=master)
[![NPM downloads](http://img.shields.io/npm/dm/wepyx.svg?style=flat)](https://npmjs.org/package/wepyx)
[![Dependencies Status](https://david-dm.org/tolerance-go/wepyx/status.svg)](https://david-dm.org/tolerance-go/wepyx)

wepyx is a lightweight front-end framework based on redux, redux-actions.(Inspired by [dva](https://github.com/dvajs/dva) and [vuex](https://github.com/vuejs/vuex))

specialized for [wepy](https://github.com/Tencent/wepy) development at present.

# Install
```zsh
npm install wepyx
```

# Usage
拿 `wepy-cli` 自动生成的模板举例，将 `redux` 换成 `wepyx`

1. 命令行输入 `wepy init standard examples`, 记得 `? Use Redux in your project? Yes` 这一步的时候要选择 yes

2. 进入刚刚生成的 `examples`，在依赖中做一些修改，然后执行 `npm install` 安装依赖
```json
"dependencies": {
- "redux": "^3.7.2",
- "redux-actions": "^2.2.1",
- "redux-promise": "^0.5.3",
- "wepy-redux": "^1.5.3",
+ "wepyx": "^0.1.0"
}
```

3. 在 `app.wpy` 中引入 `wepyx`, 稍后我们来改造 `store` 变成我们自己的 `model`
```js
// import { setStore } from 'wepy-redux'
// import configStore from './store'

// const store = configStore()
// setStore(store)
import wepyx from 'wepyx';
import model from './models/counter';
// import { loggerMiddleware } from './utils/loggerMiddleware';

// init 步骤目前可以省略
// wepyx.init({
//   extraMiddlewares: process.env.NODE_ENV === 'development' ? [loggerMiddleware] : [],
// });
wepyx.model(model);
// wepyx.models([model]);
wepyx.start();
```

4. 将 `store` 进行改造，新建一个 `models` 文件夹，里面创建 `counter.js`（老的 `store` 文件夹记得删除，防止因为依赖安装的问题报错，建议可以移动到 src 外面，方便对比）
```js
export default {
  namespace: 'counter',

  state: {
    num: 0,
    asyncNum: 0,
  },

  mutations: {
    INCREMENT(state) {
      state.num++;
    },

    DECREMENT(state) {
      state.num--;
    },

    ASYNC_INCREMENT_DONE(state, payload) {
      state.asyncNum += payload;
    },
  },

  actions: {
    ASYNC_INCREMENT() {
      return async ({ dispatcher }) => {
        const data = await new Promise(resolve => {
          setTimeout(() => {
            resolve(1);
          }, 1000);
        });
        // 大写的 actionName 会转换成小写驼峰
        dispatcher.asyncIncrementDone(data);
      };
    },
  },
};
```

5. 在视图层用到原先 store 的地方，也要响应的修改，打开 `components/counter.wpy`
```js
+ import { connect } from 'wepyx';
// import { connect } from 'wepy-redux'
// import { INCREMENT, DECREMENT } from '../store/types/counter';
// import { asyncInc } from '../store/actions';

@connect(
  {
    stateNum(state) {
      return state.counter.num;
    },
    asyncNum(state) {
      return state.counter.asyncNum;
    },
  }
  // {
  //   incNum: INCREMENT,
  //   decNum: DECREMENT,
  //   asyncInc,
  // }
)

...

methods = {
+ incNum() {
+   this.dispatcher.counter.increment();
+ },
+ decNum() {
+   this.dispatcher.counter.decrement();
+ },
+ asyncInc() {
+   this.dispatcher.counter.asyncIncrement();
+ },
  plus() {
    this.num = this.num + 1;
    console.log(this.$name + ' plus tap');
  },
  minus() {
    this.num = this.num - 1;
    console.log(this.$name + ' minus tap');
  },
};
```

6. `npm run dev` 打开微信开发者工具，选择 `examples`，进行调试吧

# API

wepyx

`wepyx.init(options)`

Arguments

* extraMiddlewares(Array): 额外的中间件

`wepyx.model(options)`

Arguments

* namespace(String): 命名空间
* state(Object): model 的数据结构
* mutations(Object): 数据的修改[copy-on-write](https://en.wikipedia.org/wiki/Copy-on-write)
  * handleActionName(String)-reducer(Function)[state, action]
* actions(Object): 事件生成器
  * actionName(String)-actionCreator(Function)[() => object|function[{ take, dispatcher, state, getState }]]
* setups(Object|Function): 启动器，所有函数在 launch 之后会调用
  * key(String)-set(Function)[({ dispatcher, take }) => void]

`wepyx.start()`: 启动

eventBus

这是一个内部实现需要的 事件中心，take 就是基于它实现的。
所有的 redux action 都会自动派发响应事件名，store 变化之后，会派发 `${actionName}:after` 事件

`eventBus.listen(type, cb, [scope]) => unlisten(Function)`: 开启监听

`eventBus.emit(type, payload)`: 派发事件

`eventBus.take(type) => chained(Promise)`: 监听一次事件，事件发生之后监听会被自动移除


model examples
```js
wepyx.model({
  namespace: 'n1',
  state: {
    count: 1,
  },
  mutations: {
    add(state, payload) {
      state.count += payload;
    },
    sub(state, payload) {
      state.count -= payload;
    },
  },
  actions: {
    asyncSub(params) {
      return async function({ eventBus, dispatcher, oldState, getState }) {
        const data = await new Promise(resolve => {
          setTimeout(() => resolve(1), 3000);
        });
        // 内部注入的 dispatcher 派发当前 namespace 的 actions 时候不需要前缀
        dispatcher.sub(data); 
        return true;
      };
    },
  },
});

wepyx.dispatcher.n1.add(1);
wepyx.dispatcher.n1.asyncSub(1).then(result => result === true);
```

# License
MIT
