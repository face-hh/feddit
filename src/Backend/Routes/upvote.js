// eslint-disable-next-line no-unused-vars
const mongodb = require('mongodb');
// eslint-disable-next-line no-unused-vars
const express = require('express');

module.exports = {
	name: 'api/upvote',
	ratelimit: 5 * 60 * 1000,
	max_requests_within_timeframe: 2000,
	method: 'post',
	/**
     * Create a post on a subreddit. Requires authentication.
     * @typedef {mongodb.MongoClient} Client
     * @typedef {express.Request} Request
     * @typedef {express.Response} Response
     * @param {Request} req The request from express.js
     * @param {Response} res The response from express.js
     * @param {Client} client The database client
     * @returns JSON
     */
	run: async (req, res, client) => {
		const { id, type } = req.body;
		const token = req.headers.authorization;

		if (!token || !id || !type) {
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

		let upvotes = 0;

		const username = userData.username;
		const existingVote = postData.votes.find(vote => vote.user === username);

		if (type === 'up') {
			if (existingVote && existingVote.vote === 1) {
				// User has already upvoted the post
				return res.sendStatus(406);
			}

			if (existingVote && existingVote.vote === -1) {
				// User had previously downvoted, now changing to upvote
				upvotes = 2;
				await collection.updateOne(
					{ id, 'votes.user': username },
					{ $set: { 'votes.$.vote': 1 }, $inc: { upvotes: 2 } },
				);
			}
			else {
				// User is upvoting for the first time
				upvotes = 1;
				await collection.updateOne({ id }, { $push: { votes: { user: username, vote: 1 } }, $inc: { upvotes: 1 } });
			}
		}
		else if (type === 'down') {
			if (existingVote && existingVote.vote === -1) {
				// User has already downvoted the post
				return res.sendStatus(406);
			}

			if (existingVote && existingVote.vote === 1) {
				upvotes = -2;
				// User had previously upvoted, now changing to downvote
				await collection.updateOne(
					{ id, 'votes.user': username },
					{ $set: { 'votes.$.vote': -1 }, $inc: { upvotes: -2 } },
				);
			}
			else {
				upvotes = -1;
				// User is downvoting for the first time
				await collection.updateOne({ id }, { $push: { votes: { user: username, vote: -1 } }, $inc: { upvotes: -1 } });
			}
		}
		else {
			return res.sendStatus(400);
		}

		await usersCollection.updateOne(query, { $push: { votedPosts: id } });
		await usersCollection.updateOne({ username }, { $inc: { karma: upvotes } });

		return res.sendStatus(200);
	},
};