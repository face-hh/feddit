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

	if (response.status === 404) {
		return swal('Oops', 'Subfeddit doesn\'t exist anymore!');
	}

	const data = await response.json();

	return data;
}

async function fetchUserData(name) {
	const response = await fetch('/api/userinfo?username=' + name, {
		method: 'GET',
		headers: headersList,
	});

	if (response.status === 404) {
		return swal('Oops', 'User doesn\'t exist anymore!');
	}

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
	if (subMembers) subMembers.innerText = formatNumber(subfedditData.fedditors?.length);
	if (subOnline) subOnline.innerText = formatNumber(subfedditData.online_fedditors?.length);

	if (subDateHref && !user) subDateHref.href = '/f/' + subfedditData.name;
	if (subTitleHref) subTitleHref.href = '/f/' + subfedditData.name;

	if (karma && user) karma.innerText = formatNumber(subfedditData.karma) + ' Karma';
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

function pushPost(votes, subfedditImage, subfeddit, title, description, postID, postAuthor, postDate) {
	const voteSampleElement = document.querySelector('.voteSample');

	const postLink = '/' + 'posts/' + postID;
	const clonedVoteElement = voteSampleElement.cloneNode(true);

	clonedVoteElement.querySelector('.voteCount').textContent = formatNumber(votes);
	clonedVoteElement.querySelector('.extraPostInfo a').innerHTML = `<a href="/f/${subfeddit}"><img src="${subfedditImage}">f/${subfeddit}</a>`;

	clonedVoteElement.querySelector('.title').textContent = title;
	clonedVoteElement.querySelector('.metadata p').textContent = description;
	clonedVoteElement.querySelector('.metadata a').href = postLink;
	clonedVoteElement.querySelector('.interactionButtons a').href = postLink;
	clonedVoteElement.querySelector('.votes').id = postID;
	clonedVoteElement.querySelector('.upvote').setAttribute('onclick', 'upvote(\'' + postID + '\')');
	clonedVoteElement.querySelector('.downvote').setAttribute('onclick', 'downvote(\'' + postID + '\')');

	clonedVoteElement.querySelector('.postedSpan').textContent = 'Posted by u/' + postAuthor + ' | ' + formatDate(postDate);

	const postDiv = document.createElement('div');
	postDiv.className = 'post';

	postDiv.appendChild(clonedVoteElement);
	postDiv.innerHTML = postDiv.innerHTML.split('\n').slice(1).join('\n');

	const scrollableDiv = document.querySelector('.scrollable');
	scrollableDiv.appendChild(postDiv);
}

function formatDate(date) {
	const now = Date.now();
	const diff = (now - date) / 1000;

	const intervals = [
		{ label: 'year', seconds: 31536000 },
		{ label: 'month', seconds: 2592000 },
		{ label: 'day', seconds: 86400 },
		{ label: 'hour', seconds: 3600 },
		{ label: 'minute', seconds: 60 },
	];

	for (let i = 0; i < intervals.length; i++) {
		const interval = intervals[i];
		const intervalDiff = Math.floor(diff / interval.seconds);

		if (intervalDiff >= 1) {
			return intervalDiff + ' ' + interval.label + (intervalDiff === 1 ? '' : 's') + ' ago';
		}
	}

	return 'just now';
}