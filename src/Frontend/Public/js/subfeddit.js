const subfeddit = window.location.href.split('/f/')[1];

document.addEventListener('DOMContentLoaded', async () => {
	const data = await fetchSubData(subfeddit);

	const subfeddiTitle = document.querySelector('.subfedditInfobox span');
	const subfedditIcon = document.querySelector('.subfedditInfobox img');
	const container = document.querySelector('.subfedditContainer');
console.log(data)
	subfeddiTitle.innerText = 'f/' + data.name;
	subfedditIcon.src = `/${data.pfp}`;

	updateOverlay(data);

	container.style.display = 'flex';
});