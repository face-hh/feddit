const loadingText = document.querySelector('.loadingText');
document.addEventListener('DOMContentLoaded', async () => {
	let endpoint;

	if (window.location.href.includes('/f/')) {
		endpoint = '/api/generatefeed?type=sub&subfeddit=' + subfeddit;
	}
	else if (window.location.href.includes('/u/')) {
		return;
	}
	else {
		endpoint = '/api/generatefeed?type=main';
	}

	const response = await fetch(endpoint, {
		method: 'GET',
		headers: headersList,
	});

	if (response.status === 429) {
		swal('Oh snap!', 'You\'re getting ratelimited! Wait around 30 minutes for it to expire, and next time don\'t be naughty!');
	}
	const data = await response.json();

	loadingText.style.display = 'none';

	data.forEach(async (post) => {
		pushPost(post.upvotes || 0, `/${post.pfp || 'default.png'}`, post.subfeddit, post.title, post.description, post.id, post.OP, post.createdAt);
	});
});

function formatNumber(number) {
	if (number >= 1000000) {
		return (number / 1000000).toFixed(1) + 'm';
	}
	else if (number >= 1000) {
		return (number / 1000).toFixed(1) + 'k';
	}
	else {
		return number.toString();
	}
}
async function upvote(parent) {
	const upvoteBtn = document.querySelector(`[id='${parent}'] .voteButtons .upvote`);
	const downvoteBtn = document.querySelector(`[id='${parent}'] .voteButtons .downvote`);
	const deactivated = !upvoteBtn.src.includes('active');

	if (!deactivated) return;

	downvoteBtn.src = '/images/downvote.png';

	if (deactivated) {
		upvoteBtn.src = '/images/upvote_active.png';
	}
	else {
		upvoteBtn.src = '/images/upvote.png';
	}

	const res = await sendUpvote(parent, 'up');

	if (res !== 200) swal('Oopsie...', 'Looks like something went wrong while voting!');
}

async function downvote(parent) {
	const upvoteBtn = document.querySelector(`[id='${parent}'] .voteButtons .upvote`);
	const downvoteBtn = document.querySelector(`[id='${parent}'] .voteButtons .downvote`);
	const deactivated = !downvoteBtn.src.includes('active');

	if (!deactivated) return;

	upvoteBtn.src = '/images/upvote.png';

	if (deactivated) {
		downvoteBtn.src = '/images/downvote_active.png';
	}
	else {
		downvoteBtn.src = '/images/downvote.png';
	}

	const res = await sendUpvote(parent, 'down');

	if (res !== 200) {
		swal('Oopsie...', 'Looks like something went wrong while voting!');
	}
}

function makeid(length) {
	let result = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const charactersLength = characters.length;
	let counter = 0;
	while (counter < length) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
		counter += 1;
	}
	return result;
}