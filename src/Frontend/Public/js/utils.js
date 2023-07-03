window.getCookie = function(name) {
	const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
	if (match) return match[2];
};

const headersList = {
	'authorization': window.getCookie('_SESSION_TOKEN'),
	'Content-Type': 'application/json',
};


async function fetchPostData(id) {
	const response = await fetch('/api/getpost?id=' + id, {
		method: 'GET',
		headers: headersList,
	});

	const data = await response.json();

	return data;
}

async function fetchSubData(name) {
	const response = await fetch('/api/getsubfeddit?subfeddit=' + name, {
		method: 'GET',
		headers: headersList,
	});

	const data = await response.json();

	return data;
}

function formatDate(date) {
	// open a pull request in case aliens decide to add the 13th month
	const months = [
		'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
		'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
	];

	const d = new Date(date);
	const month = months[d.getMonth()];
	const day = d.getDate();
	const year = d.getFullYear();

	return `${month} ${day}, ${year}`;
}

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

function getTimeDifferenceInMinutes(expireDate) {
	const milliseconds = (expireDate * 1000) - Date.now();
	const minutes = Math.floor(milliseconds / (1000 * 60));
	return minutes;
}

function updateOverlay(subfedditData, user = false) {
	const subTitle = document.querySelector('.subfedditTitle span');
	const subDesc = document.querySelector('.subfedditDescription');
	const subTitleHref = document.querySelector('.subfedditTitle');
	const subDate = document.querySelector('.birthdayA span');
	const subDateHref = document.querySelector('.birthdayA');
	const karma = document.querySelector('.karma');
	const subMembers = document.querySelector('.mainText');
	const subOnline = document.querySelector('.memberStats > div:nth-child(2) > span.mainText');

	if (subTitle) subTitle.innerText = subfedditData.name;
	if (subDesc) subDesc.innerText = subfedditData.description;
	if (subDate) subDate.innerText = `Created ${formatDate(subfedditData.createdAt)}`;
	if (subMembers) subMembers.innerText = formatNumber(subfedditData.fedditors.length);
	if (subOnline) subOnline.innerText = formatNumber(subfedditData.online_fedditors.length);

	if (subDateHref && !user) subDateHref.href = '/f/' + subfedditData.name;
	if (subTitleHref) subTitleHref.href = '/f/' + subfedditData.name;

	if (karma && user) karma.innerText = subfedditData.karma;
}

async function logout() {
	await fetch('/api/logout', {
		method: 'GET',
		headers: headersList,
	});

	document.cookie = '';
	window.location.href = '/login';
}


async function sendUpvote(id, type) {
	const votes = document.querySelector(`[id='${id}'] .voteButtons .voteCount`);
	const bodyContent = JSON.stringify({ id, type });

	const response = await fetch('/api/upvote', {
		method: 'POST',
		body: bodyContent,
		headers: headersList,
	});

	const postData = await fetchPostData(id);

	if (response.status === 200) votes.innerText = formatNumber(postData.upvotes);

	return response.status;
}