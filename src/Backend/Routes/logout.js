// eslint-disable-next-line no-unused-vars
const mongodb = require('mongodb');
// eslint-disable-next-line no-unused-vars
const express = require('express');

module.exports = {
	name: 'api/logout',
	ratelimit: 30 * 60 * 1000,
	max_requests_within_timeframe: 10,
	method: 'get',
	/**
     * Login an user, or sign up.
     * @typedef {mongodb.MongoClient} Client
     * @typedef {express.Request} Request
     * @typedef {express.Response} Response
     * @param {Request} req The request from express.js
     * @param {Response} res The response from express.js
     * @param {Client} client The database client
     * @returns JSON Boolean
     */
	run: async (req, res, client) => {
		const token = req.headers.authorization;

		if (!token) {
			return res.sendStatus(400);
		}

		const db = client.db('feddit');
		const collection = db.collection('users');
		const query = { sessionToken: token };

		const userData = await collection.findOne(query);

		if (!userData) {
			return res.sendStatus(403);
		}

		res.cookie('_SESSION_TOKEN', '');

		await collection.updateOne(query, {
			$set: {
				sessionToken: '',
			},
		});

		return res.sendStatus(200);
	},
};