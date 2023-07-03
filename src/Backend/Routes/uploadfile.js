const { writeFileSync } = require('fs');
const sharp = require('sharp');

sharp.cache(false);

// eslint-disable-next-line no-unused-vars
const mongodb = require('mongodb');
// eslint-disable-next-line no-unused-vars
const express = require('express');

module.exports = {
	name: 'api/uploadicon',
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
		const file = req.file;

		if (
			!token ||
			!file ||
            !body.name
		) {
			return res.sendStatus(400);
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
		if (!subData) {
			return res.sendStatus(404);
		}
		// doesn't own subfeddit
		if (userData.username !== subData.owner) {
			return res.sendStatus(403);
		}

		const sharpBuffer = await sharp(file.path).resize().jpeg({ quality: 50 });
		const buffer = await sharpBuffer.toBuffer();
		const filename = file.path.split('\\')[1];

		await writeFileSync(file.path, buffer);

		subCollection.updateOne({ name: body.name }, {
			$set: {
				pfp: filename,
			},
		});

		return res.sendStatus(200);
	},
};