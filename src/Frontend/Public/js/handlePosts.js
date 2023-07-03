const requestBody = {};

async function post() {
	const headersList = {
		'authorization': window.getCookie('_SESSION_TOKEN'),
		'Content-Type': 'application/json',
	};

	const bodyContent = JSON.stringify(requestBody);

	const response = await fetch('/api/createpost', {
		method: 'POST',
		body: bodyContent,
		headers: headersList,
	});

	if (response.status === 400) {
		swal('Oops', 'Something is missing in the request!', 'error');

		return;
	}
	else if (response.status === 403) {
		await swal('Oh no!', 'You\'re not logged in! Click "OK" to get redirected.', 'error');

		window.location.href = '/login';

		return;
	}
	const data = await response.json();

	return window.location.href = '/posts/' + data?.id;
}

const subfedditTitle = document.getElementById('subfedditTitle');
const inputTitle = document.getElementById('actualTitle');
const inputDesc = document.querySelector('.description');
const charLimitTitle = document.querySelector('.titleDiv > .charLimit');
const charLimitDesc = document.querySelector('.desc > .charLimit');

subfedditTitle.addEventListener('input', () => {
	requestBody.subfeddit = subfedditTitle.value;
});

inputTitle.addEventListener('input', () => {
	requestBody.title = inputTitle.value;

	updateCurrentChar(inputTitle, charLimitTitle, 300);
});

inputDesc.addEventListener('input', () => {
	requestBody.description = inputDesc.value;

	updateCurrentChar(inputDesc, charLimitDesc, 6000);
});

function updateCurrentChar(input, charLimit, limit) {
	const characterCount = input.value.length;

	charLimit.textContent = `${characterCount}/${limit}`;
}