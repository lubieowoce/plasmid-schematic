const path = require('path')
const HtmlWebPackPlugin = require("html-webpack-plugin")

module.exports = (env = {}) => {
	const {mode = 'production'} = env
	const isDev = (mode === 'development')

	return {
		mode: mode,
		devtool: (isDev ? 'source-map' : false),
		entry: './src/index.js',
		module: {
			rules: [
				{
					test: /.*\.js$/,
					exclude: /node_modules/,
					use: ['babel-loader'],
				},
				{
					test: /.*\.html$/,
					use: ['html-loader'],
				},
			],
		},
		plugins: [
			new HtmlWebPackPlugin({
				template: "./src/index.html",
				filename: "./index.html"
			})
		],
		resolve: {
			extensions: ['*', '.js'],
		},
		output: {
			filename: 'index.js',
			path: path.resolve(__dirname, 'dist'),
		},
		devServer: {
			contentBase: path.join(__dirname, 'dist'),
			// compress: true,
			port: 9000,
			disableHostCheck: true,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": "true",
				"Access-Control-Allow-Headers": "Content-Type, Authorization, x-id, Content-Length, X-Requested-With",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			}
		}
	}
}