const proceedButton = document.getElementById('proceed-button');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

proceedButton.addEventListener('click', async () => {
	const username = usernameInput.value;
	const password = passwordInput.value;

	const res = await fetch('api/login', {
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			username,
			password,
		}),
		method: 'POST',
	});

	const ratelimit = res.headers.get('x-ratelimit-reset');

	const status = res.status;
	const json = await res.json().catch(() => {});

	if (status === 403) {
		swal('Invalid credentials.', 'We couldn\'t log you in :(', 'error');
	}
	if (status === 400) {
		swal('Oops', 'Something is missing from the request! Did you input "username"?', 'error');
	}
	else if (status === 429) {
		swal('Oh no!', `You're getting ratelimited! Try again in ${getTimeDifferenceInMinutes(ratelimit)} minutes!`, 'error');
	}
	else if (json?.status === 400) {
		swal('Oh no!', json.error, 'error');
	}
	else if (status === 200) {
		await swal('Welcome!', 'You\'ve been authenticated!', 'success');

		window.location.href = '/home';
	}
});

