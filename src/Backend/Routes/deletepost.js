const { ObjectId } = require('mongodb');

module.exports = {
    name: 'api/posts/delete',
    ratelimit: 60 * 1000,
    max_requests_within_timeframe: 30,
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
            !body.id ||
            !body.subfedditID ||
            !ObjectId.isValid(body.id) ||
            !ObjectId.isValid(body.subfedditID)
        ) {
            return res.sendStatus(400);
        }

        const db = client.db('feddit');
        const posts = db.collection('posts');
        const subfeddits = db.collection('subfeddits');
        const usersCollection = db.collection('users');
        const userData = await usersCollection.findOne(query);

        if (!userData) {
            return res.sendStatus(403);
        }

        const postID = new ObjectId(body.id);
        const subfedditID = new ObjectId(body.subfedditID);

        const subfedditData = subfeddits.findOne({ _id: subfedditID });
        if (!subfedditData) {
            return res.sendStatus(404);
        }

        if (subfedditData.owner !== userData.username) {
            return res.sendStatus(403);
        }

        await posts.deleteOne({ _id: postID });
        return res.sendStatus(200);
    },
};
