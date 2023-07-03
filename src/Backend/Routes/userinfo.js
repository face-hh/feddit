// eslint-disable-next-line no-unused-vars
const mongodb = require('mongodb');
// eslint-disable-next-line no-unused-vars
const express = require('express');

module.exports = {
	name: 'api/userinfo',
	ratelimit: 1 * 60 * 1000,
	max_requests_within_timeframe: 100,
	method: 'get',
	/**
     * Get user info from token. Requires authorization in headers.
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
		const collection = db.collection('users');

		const userData = await collection.findOne({ sessionToken: token });

		if (!userData) return res.sendStatus(403);

		return res.send({
			username: userData.username,
			joinedAt: userData.joinedAt,
			description: userData.description,
			karma: userData.karma,
		});
	},
};