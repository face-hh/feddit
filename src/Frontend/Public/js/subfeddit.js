const subfeddit = window.location.href.split('/f/')[1];

document.addEventListener('DOMContentLoaded', async () => {
	const data = await fetchSubData(subfeddit);

	const subfeddiTitle = document.querySelector('.subfedditInfobox span');

	subfeddiTitle.innerText = 'f/' + subfeddit;

	updateOverlay(data);
});