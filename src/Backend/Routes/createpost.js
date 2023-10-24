// eslint-disable-next-line no-unused-vars
const mongodb = require('mongodb');
// eslint-disable-next-line no-unused-vars
const express = require('express');
const crypto = require('crypto');

module.exports = {
	name: 'api/createpost',
	ratelimit: 30 * 60 * 1000,
	max_requests_within_timeframe: 10,
	method: 'post',
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
		const body = req.body;
		const token = req.headers.authorization;

		if (
			!token ||
			!body.title ||
			!body.description ||
			!body.subfeddit ||
			body.title.length > 300 ||
			body.description.length > 6000
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
		const postID = generateAddon();

		await collection.insertOne({
			title: body.title,
			description: body.description,
			subfeddit: body.subfeddit.replace(/\/f\/|f\//g, ''),
			id: postID,
			createdAt: Date.now(),
			votes: [],
			OP: userData.username,
			upvotes: 0,
		});

		return res.json({
			id: postID,
		});
	},
};

function generateAddon() {
	const bytes = crypto.randomBytes(10);

	const token = bytes.toString('hex');

	return token;
}