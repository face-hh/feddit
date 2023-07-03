const sharp = require('sharp');

sharp.cache(false);

// eslint-disable-next-line no-unused-vars
const mongodb = require('mongodb');
// eslint-disable-next-line no-unused-vars
const express = require('express');

module.exports = {
	name: 'api/setuser',
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
		const token = req.headers.authorization;
		const body = req.body;

		if (
			!token ||
			!body.description
		) {
			return res.sendStatus(400);
		}

		const db = client.db('feddit');

		const usersCollection = db.collection('users');

		const query = { sessionToken: token };

		const userData = await usersCollection.findOne(query);

		if (!userData) {
			return res.sendStatus(403);
		}

		usersCollection.updateOne(query, {
			$set: {
				description: body.description,
			},
		});

		return res.sendStatus(200);
	},
};