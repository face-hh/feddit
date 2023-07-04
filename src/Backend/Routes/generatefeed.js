module.exports = {
	name: 'api/generatefeed',
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
		const token = req.headers.authorization;
		const type = req.query.type;
		const username = req.query.username;
		const subfeddit = req.query.subfeddit;

		if (!token || !['sub', 'user', 'main'].includes(type)) return res.sendStatus(400);
		if (type === 'sub' && !subfeddit) return res.sendStatus(400);
		if (type === 'user' && !username) return res.sendStatus(400);

		const db = client.db('feddit');
		const postsCollection = db.collection('posts');
		const usersCollection = db.collection('users');
		const subfedditsCollection = db.collection('subfeddits');

		const query = { sessionToken: token };
		const userData = await usersCollection.findOne(query);

		if (!userData) {
			return res.sendStatus(403);
		}

		const aggregateOptions = [];
		if (type === 'sub') {
			aggregateOptions.push({ $match: { subfeddit } });
		}
		if (type === 'user') {
			aggregateOptions.push({ $match: { OP: username } });
		}

		aggregateOptions.push({ $limit: 100 });
		aggregateOptions.push({ $sort: { upvotes: -1, createdAt: 1 } });

		const additionalData = await getAdditionalData(postsCollection, aggregateOptions);
		const additionalDataWithPfp = await fetchPfpForPosts(additionalData, subfedditsCollection);

		const mostVisitedSubfeddits = Object.entries(userData.mostVisitedSubfeddits)
			.sort((a, b) => a[1] - b[1])
			.map(([subfedditName]) => getSubfedditData(subfedditName, postsCollection, subfedditsCollection));

		const subfedditDataArray = await Promise.all(mostVisitedSubfeddits);
		const subfedditDataWithPfp = await fetchPfpForPosts(subfedditDataArray.flat(), subfedditsCollection);

		const data = additionalDataWithPfp.concat(subfedditDataWithPfp);

		return res.json(shuffleArray(data));
	},
};

async function getAdditionalData(postsCollection, aggregateOptions) {
	return postsCollection
		.aggregate(aggregateOptions)
		.toArray();
}

async function fetchPfpForPosts(posts, subfedditsCollection) {
	const subfedditCache = {};

	return Promise.all(
		posts.map(async (post) => {
			const subfedditName = post.subfeddit;

			if (subfedditCache[subfedditName]) {
				return { ...post, pfp: subfedditCache[subfedditName] };
			}

			const subfeddit = await subfedditsCollection.findOne({ name: subfedditName });

			if (!subfeddit) return post;

			subfedditCache[subfedditName] = subfeddit.pfp;

			return { ...post, pfp: subfeddit.pfp };
		}),
	);
}

async function getSubfedditData(subfedditName, postsCollection, subfedditsCollection) {
	const subfeddit = await subfedditsCollection.findOne({ name: subfedditName });

	if (!subfeddit) return [];

	return postsCollection
		.aggregate([
			{ $match: { subfeddit: subfeddit.name } },
			{ $limit: 100 },
			{ $sort: { upvotes: -1, createdAt: 1 } },
		])
		.toArray();
}

function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}