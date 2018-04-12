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
1. `npm install babel-plugin-global-define -D` 之后在 `wepy.config.js` 中使用插件增加环境变量，可能你的项目中还需要其他的环境变量 eg: `BASE_API` 一并加上吧～
```js
babel: {
  sourceMap: true,
  presets: ['env'],
  plugins: [
    'transform-class-properties',
    'transform-decorators-legacy',
    'transform-object-rest-spread',
    'transform-export-extensions',
    [
      'global-define', // here ~
      {
        'process.env.NODE_ENV': process.env.NODE_ENV,
        'process.env.PLAT_ENV': 'wxapp',
      },
    ],
  ],
},
```

2. 在 `app.wpy` 中引入 `wepyx`
```js
import wepyx from 'wepyx';
import models from './models';
import { loggerMiddleware } from './utils/loggerMiddleware';

wepyx.init({
  extraMiddlewares: process.env.NODE_ENV === 'development' ? [loggerMiddleware] : [],
});
wepyx.models(models);
wepyx.start();
```
model example
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

# License
MIT
