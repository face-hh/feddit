// eslint-disable-next-line no-unused-vars
const mongodb = require('mongodb');
// eslint-disable-next-line no-unused-vars
const express = require('express');

module.exports = {
	name: 'api/getpost',
	ratelimit: 5 * 60 * 1000,
	max_requests_within_timeframe: 2000,
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
		const id = req.query?.id;
		const token = req.headers.authorization;

		if (
			!token ||
			!id
		) {
			return res.sendStatus(400);
		}

		const db = client.db('feddit');
		const collection = db.collection('posts');
		const usersCollection = db.collection('users');
		const query = { sessionToken: token };

		const userData = await usersCollection.findOne(query);

		if (!userData) {
			return res.sendStatus(403);
		}

		const postData = await collection.findOne({ id });

		if (!postData) {
			return res.sendStatus(404);
		}

		const timesVisited = userData.mostVisitedSubfeddits[postData.subfeddit];

		if (!timesVisited) {
			userData.mostVisitedSubfeddits[postData.subfeddit] = 1;
		}
		else {
			userData.mostVisitedSubfeddits[postData.subfeddit]++;
		}

		await usersCollection.updateOne(query, {
			$set: {
				mostVisitedSubfeddits: userData.mostVisitedSubfeddits,
			},
		});

		return res.json({
			id,
			subfeddit: postData.subfeddit,
			title: postData.title,
			description: postData.description,
			createdAt: postData.createdAt,
			upvotes: postData.upvotes,
		});
	},
};