require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');


const loginPath = path.resolve('src/Frontend/login.html');
const mainPath = path.resolve('src/Frontend/homepage.html');
const submitPath = path.resolve('src/Frontend/submit.html');
const postPath = path.resolve('src/Frontend/post.html');
const subfedditPath = path.resolve('src/Frontend/subfeddit.html');
const userPath = path.resolve('src/Frontend/user.html');
const subfedditManagePath = path.resolve('src/Frontend/manage.html');
const editProfilePath = path.resolve('src/Frontend/edit.html');

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, 'CDN/');
	},
	filename: (_req, file, cb) => {
		const fileName = `${Date.now()}.${file?.mimetype?.split?.('/')?.[1]}`;
		cb(null, fileName);
	},
});

const upload = multer({ storage });

const { MongoClient } = require('mongodb');

/** MONGODB */
const client = new MongoClient(process.env.DB);

/** EXPRESS.JS */
const app = express();

app.use(express.static(path.resolve('src/Frontend/Public')));
app.use(express.static(path.resolve('CDN')));
app.use(cookieParser());
app.set('trust proxy', 1);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

app.use((err, req, res, next) => {
	// This check makes sure this is a JSON parsing issue, but it might be
	// coming from any middleware, not just body-parser:

	if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
		console.error(err);
		return res.sendStatus(400);
	}

	next();
});

function verifySession(req, res, next) {
	if (req.originalUrl.includes('/api/')) return next();

	const session_cookie = req.cookies._SESSION_TOKEN;

	try {
		jwt.verify(session_cookie, process.env.Encryption_Key);
		next();
	}
	catch (e) {
		res.sendFile(loginPath);
	}
}

// Register the middleware globally
app.use(verifySession);

app.get('/login', async (req, res) => {
	res.redirect('/');
});

app.get('/', async (req, res) => {
	res.sendFile(mainPath);
});

app.get('/home', async (req, res) => {
	res.sendFile(mainPath);
});

app.get('/posts/:id', async (req, res) => {
	res.sendFile(postPath);
});

app.get('/f/:name', async (req, res) => {
	res.sendFile(subfedditPath);
});

app.get('/u/:username', async (req, res) => {
	res.sendFile(userPath);
});

app.get('/submit', async (req, res) => {
	res.sendFile(submitPath);
});

app.get('/manage', async (req, res) => {
	res.sendFile(subfedditManagePath);
});

app.get('/edit', async (req, res) => {
	res.sendFile(editProfilePath);
});

// parse application/json
app.use(bodyParser.json());

require('./Routes/handler')(app, client, upload);

const server = app.listen(3000, '127.0.0.2', async () => {
	await connectDatabase();
	const { address, port } = server.address();
	console.log(`Server listening at http://${address}:${port}`);
});

async function connectDatabase() {
	await client.connect();
	console.log('Connected successfully to server');
}
