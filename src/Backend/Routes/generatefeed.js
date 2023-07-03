// eslint-disable-next-line no-unused-vars
const mongodb = require('mongodb');
// eslint-disable-next-line no-unused-vars
const express = require('express');

module.exports = {
	name: 'api/generatefeed',
	ratelimit: 30 * 60 * 1000,
	max_requests_within_timeframe: 1000,
	method: 'get',
	/**
     * Create a post on a subfeddit. Requires authentication.
     * @typedef {mongodb.MongoClient} Client
     * @typedef {express.Request} Request
     * @typedef {express.Response} Response
     * @param {Request} req The request from express.js
     * @param {Response} res The response from express.js
     * @param {Client} client The database client
     * @returns JSON
     */
	run: async (req, res, client) => {
		const token = req.headers.authorization;

		if (!token) {
			return res.sendStatus(400);
		}

		const db = client.db('feddit');
		const postsCollection = db.collection('posts');

		const usersCollection = db.collection('users');

		const query = { sessionToken: token };

		const userData = await usersCollection.findOne(query);

		if (!userData) {
			return res.sendStatus(403);
		}

		const mostVisited = userData.mostVisitedSubfeddits;

		const mostVisitedSubfeddits = [];
		for (const vehicle in mostVisited) {
			mostVisitedSubfeddits.push([vehicle, mostVisited[vehicle]]);
		}

		mostVisitedSubfeddits.sort(function(a, b) {
			return a[1] - b[1];
		});

		const promises = mostVisitedSubfeddits.map(async (array) => {
			const subfeddit = array[0];

			const subfedditData = await postsCollection.aggregate([
				{ $match: { subfeddit: subfeddit } },
				{ $limit: 50 },
				{ $addFields: { votesLength: { $size: '$votes' } } },
				{ $sort: { votesLength: -1, createdAt: 1 } },
			]).toArray();

			return shuffleArray(subfedditData);
		});

		const promisedDataArray = await Promise.all(promises);
		let data = [];

		promisedDataArray.forEach((promisedData) => {
			promisedData.forEach((post) => data.push(post));
		});

		if (data.length === 0) {
			const additionalData = await postsCollection.aggregate([
				{ $limit: 50 },
				{ $addFields: { votesLength: { $size: '$votes' } } },
				{ $sort: { votesLength: -1, createdAt: 1 } },
			]).toArray();

			data = shuffleArray(additionalData);
		}

		return res.json(data);
	},
};

function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}