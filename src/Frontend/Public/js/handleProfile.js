const usernameDiv = document.querySelector('.username');
const extraInfo = document.querySelector('.extraInfo');

const globalProfile = document.querySelector('.userProfileLink');

document.addEventListener('DOMContentLoaded', async () => {
	const data = await fetchUserData();

	if (!data) {
		globalProfile.addEventListener('click', event => event.preventDefault());
	}

	username = data.username;

	usernameDiv.textContent = 'u/' + username;
	globalProfile.href = '/u/' + username;

	// user profile
	const usernameDiv2 = document.querySelector('.subfedditInfobox span');

	if (usernameDiv2 && window.location.href.includes('/u/')) {
		const providedUsername = window.location.href.split('/u/')[1];
		const providedData = await fetchUserData(providedUsername);

		usernameDiv2.innerText = 'u/' + providedUsername;

		updateOverlay({
			description: providedData.description,
			createdAt: providedData.joinedAt,
			karma: formatNumber(providedData.karma),
		}, true);

		const endpoint = '/api/generatefeed?type=user&username=' + providedUsername;

		const response = await fetch(endpoint, {
			method: 'GET',
			headers: headersList,
		});

		if (response.status === 429) {
			swal('Oh snap!', 'You\'re getting ratelimited! Wait around 30 minutes for it to expire, and next time don\'t be naughty!');
		}

		const data2 = await response.json();

		document.querySelector('.loadingText').style.display = 'none';
		document.querySelector('.subfedditContainer').style.display = 'flex';
		data2.forEach(async (post) => {
			pushPost(post.upvotes || 0, `/${post.pfp}`, post.subfeddit, post.title, post.description, post.id, post.OP, post.createdAt);
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