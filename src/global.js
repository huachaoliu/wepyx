/* global wx */
/**
 * 在小程序框架 wepy 中，暂时无法解决循环加载的问题
 * 用一个全局存在的对象来挂载数据
 */
const judgeEnv = env => {
  switch (env) {
    case 'wxapp':
      return wx;
    default:
      return {};
  }
};

export const globalObject = judgeEnv(process.env.PLAT_ENV);
