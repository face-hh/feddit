const rateLimit = require('express-rate-limit');
const fs = require('fs');

/**
 * @typedef {import('express').Application} App
 * @typedef {import('mongodb').MongoClient} Client
 * @param {App} app The express.js application.
 * @param {Client} client The MongoDB client.
 */
module.exports = function(app, client, upload) {
	fs.readdirSync(__dirname).forEach(file => {
		// Ignore main file
		if (file == 'handler.js') return;

		const name = file?.split('.')?.[0];
		const route = require(`./${name}`);

		const apiLimiter = rateLimit({
			windowMs: route.ratelimit,
			max: route.max_requests_within_timeframe,
			standardHeaders: true,
		});
		console.log(route.ratelimit);
		app.use(`/${route.name}/`, apiLimiter);

		if (route.name === 'api/uploadicon') {
			app[route.method](`/${route.name}`, upload.single('avatar'), async (req, res) => {
				route.run(req, res, client);
			});
		}
		else {
			app[route.method](`/${route.name}`, async (req, res) => {
				route.run(req, res, client);
			});
		}
	});

};