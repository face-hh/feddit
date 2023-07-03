// eslint-disable-next-line no-unused-vars
const mongodb = require('mongodb');
// eslint-disable-next-line no-unused-vars
const express = require('express');

module.exports = {
	name: 'api/generatesubfeed',
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
		const subfeddit = req.query.name;
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

		const subfedditData = await postsCollection.aggregate([
			{ $match: { subfeddit: subfeddit } },
			{ $limit: 100 },
			{ $addFields: { votesLength: { $size: '$votes' } } },
			{ $sort: { votesLength: -1, createdAt: 1 } },
		]).toArray();

		return res.json(shuffleArray(subfedditData));
	},
};

function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}