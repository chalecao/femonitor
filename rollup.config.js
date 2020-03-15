import buble from 'rollup-plugin-buble'
// 通过这个插件可以方便的使用 javascript 的新特性，配置上稍微麻烦一些，如下安装相应插件（包括配置babel 需要的插件）
import babel from 'rollup-plugin-babel'
// 帮助 Rollup 查找外部模块，然后安装，相关配置
// import resolve from 'rollup-plugin-node-resolve'
// import json from 'rollup-plugin-json';
// rollup-plugin-node-resolve 插件可以解决 ES6模块的查找导入，但是npm中的大多数包都是以CommonJS模块的形式出现的，所以需要使用这个插件将CommonJS模块转换为 ES2015 供 Rollup 处理
import commonjs from 'rollup-plugin-commonjs'
// import uglify from 'rollup-plugin-uglify'
// import { minify } from 'uglify-es'
const isProduction = process.env.NODE_ENV === 'production';
import { terser } from "rollup-plugin-terser";

// console.log(process.env)

const common = {
    external: [],
    plugins: [
        babel({
            "presets": [[
                "env",
                {
                    "modules": false,
                    loose: true,
                    exclude: ['transform-es2015-typeof-symbol'],
                    targets: {
                        browsers: ["Android >= 4.4", "ios > 7"]
                    },
                    "useBuiltIns": false
                }
            ], "stage-3"],
            "plugins": [
                // ["transform-react-jsx", {
                //     "pragma": "h"
                // }],
                "add-module-exports",
                "external-helpers"
            ]
        }),

        commonjs({
            include: 'node_modules/**', // 包括
            exclude: [],  // 排除
        }),
        buble(),
        (isProduction &&
            terser()
        )
    ]
}
export default [{
    input: './src/index.js',
    output: {
        file: './public/fedmonitor.js',
        format: 'iife'
    },
    ...common
}]