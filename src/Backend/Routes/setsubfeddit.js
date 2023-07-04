const sharp = require('sharp');

sharp.cache(false);

// eslint-disable-next-line no-unused-vars
const mongodb = require('mongodb');
// eslint-disable-next-line no-unused-vars
const express = require('express');

module.exports = {
	name: 'api/setsubfeddit',
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
		const subredditNameRegex = /^[a-z0-9_]{3,21}$/;;

		if (
			!token ||
            !body.name ||
			!body.description
		) {
			return res.sendStatus(400);
		}

		if (
			!subredditNameRegex.test(body.name)
		) {
			return res.json({ status: 400, error: 'Subreddit name can only have english characters, numbers, and must be within 3 and 21 characters.' })
		}

		const db = client.db('feddit');

		const subCollection = db.collection('subfeddits');
		const usersCollection = db.collection('users');

		const query = { sessionToken: token };

		const userData = await usersCollection.findOne(query);
		const subData = await subCollection.findOne({ name:body.name });

		if (!userData) {
			return res.sendStatus(403);
		}

		if (!body.name.startsWith("f/")) {
			return res.sendStatus(403);
		}

		if (!subData) {
			await subCollection.insertOne({
				name: body.name,
				description: body.description,
				fedditors: [],
				online_fedditors: [],
				owner: userData.username,
				createdAt: Date.now(),
				pfp: 'default.png',
			});

			return res.sendStatus(227);
		}
		// doesn't own subfeddit
		if (userData.username !== subData.owner) {
			return res.sendStatus(403);
		}

		subCollection.updateOne({ name: body.name }, {
			$set: {
				description: body.description,
			},
		});

		return res.sendStatus(200);
	},
};