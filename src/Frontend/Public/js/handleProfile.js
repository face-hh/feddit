const usernameDiv = document.querySelector('.username');
const extraInfo = document.querySelector('.extraInfo');
const globalProfile = document.querySelector('.userProfileLink');

let username;

document.addEventListener('DOMContentLoaded', async () => {
	const res = await fetch('/api/userinfo', {
		headers: headersList,
		method: 'GET',
	});

	if (res.status === 403) {
		globalProfile.addEventListener('click', event => event.preventDefault());
	}
	const data = await res.json();

	username = data.username;

	usernameDiv.textContent = 'u/' + username;
	globalProfile.href = '/u/' + username;

	// user profile
	const usernameDiv2 = document.querySelector('.subfedditInfobox span');

	if (usernameDiv2) {
		usernameDiv2.innerText = 'u/' + username;

		updateOverlay({
			description: data.description,
			createdAt: data.joinedAt,
			karma: formatNumber(data.karma),
		}, true);

		const endpoint = '/api/generateuserfeed?username=' + username;

		const response = await fetch(endpoint, {
			method: 'GET',
			headers: headersList,
		});

		if (response.status === 429) {
			swal('Oh snap!', 'You\'re getting ratelimited! Wait around 30 minutes for it to expire, and next time don\'t be naughty!');
		}

		const data2 = await response.json();

		data2.forEach((post) => {
			pushPost(post.votesLength, '/images/random_guy.png', post.subfeddit, post.title, post.description, post.id);
		});
	}
});

const userMenu = document.querySelector('.dropbtn');
const profile = document.querySelector('.profile ul');

profile.setAttribute('close', '');

let method = 'close';

userMenu.addEventListener('click', () => {
	if (method === 'open') {
		method = 'close';
	}
	else {
		method = 'open';
	}

	manageProfileSettings();
});

function manageProfileSettings() {
	const removedMethod = method === 'open' ? 'close' : 'open';

	profile.removeAttribute(removedMethod);
	profile.setAttribute(method, '');
}