// rspack.config.mjs
import { rspack } from "@rspack/core";

/** @type {import("@rspack/core").Configuration} */
export default {
  mode: "production",

  target: "node",

  entry: {
    main: "./src/main.ts",
  },

  output: {
    filename: "[name].js",
    path: new URL("./build", import.meta.url).pathname,
    module: true,
    library: {
      type: "module",
    },
    clean: true,
  },

  experiments: {
    outputModule: true,
  },

  resolve: {
    extensions: [".ts", ".js"],
    extensionAlias: {
      ".js": [".ts", ".js"],
      ".mjs": [".mts", ".mjs"],
      ".cjs": [".cts", ".cjs"],
    },
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "builtin:swc-loader",
        options: {
          jsc: {
            parser: {
              syntax: "typescript",
            },
          },
        },
        type: "javascript/auto",
      },
    ],
  },

  optimization: {
    minimize: true,
  },
};
