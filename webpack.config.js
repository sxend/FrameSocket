let path = require('path');

module.exports = {
  entry: "./FrameSocket.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "FrameSocket.js"
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  }
};