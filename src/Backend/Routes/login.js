// eslint-disable-next-line no-unused-vars
const mongodb = require('mongodb');
// eslint-disable-next-line no-unused-vars
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const saltRounds = 10;

module.exports = {
	name: 'api/login',
	ratelimit: 30 * 60 * 1000,
	max_requests_within_timeframe: 10,
	method: 'post',
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
		const body = req.body;

		if (!body.username) {
			return res.sendStatus(400);
		}

		const db = client.db('feddit');
		const collection = db.collection('users');
		const query = { username: body.username };

		const userData = await collection.findOne(query);

		if (!userData) {
			// sign up
			console.log('no data, turning to sign up');

			const encryptedPass = await bcrypt.hash(body.password, saltRounds);
			const userID = new mongodb.ObjectId();

			const sessionToken = jwt.sign({
				userID: userID,
				date: Date.now(),
				addon: generateAddon(),
			}, process.env.Encryption_Key);

			await collection.insertOne({
				_id: userID,
				username: body.username,
				password: encryptedPass,
				sessionToken,
				joinedAt: Date.now(),
				mostVisitedSubfeddits: {},
				karma: 0,
			});

			res.cookie('_SESSION_TOKEN', sessionToken);

			return res.sendStatus(200);
		}
		else {
			// login
			console.log('data found, logging in...');

			const samePass = await bcrypt.compare(body.password, userData.password);

			if (!samePass) return res.sendStatus(403);

			const sessionToken = jwt.sign({
				userID: userData._id,
				date: Date.now(),
				addon: generateAddon(),
				subfeddits: {},
				description: 'I haven\'t set a description yet!',
			}, process.env.Encryption_Key);

			res.cookie('_SESSION_TOKEN', sessionToken);

			await collection.updateOne(query, {
				$set: {
					sessionToken,
				},
			});

			return res.sendStatus(200);
		}
	},
};

function generateAddon() {
	const bytes = crypto.randomBytes(24);

	const token = bytes.toString('hex');

	return token;
}
