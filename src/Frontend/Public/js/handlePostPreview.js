const id = window.location.href.split('posts/')[1];

window.addEventListener('DOMContentLoaded', async function() {
	const data = await fetchPostData(id);
	const subfedditData = await fetchSubData(data.subfeddit);

	const title = document.getElementById('title');
	const desc = document.getElementById('description');

	updateOverlay(subfedditData);

	title.innerText = data.title;
	desc.innerText = data.description;

	title.style.height = 'auto';
	title.style.height = title.scrollHeight - 20 + 'px';

	const descriptionText = desc.innerText;
	desc.innerText = '';
	desc.appendChild(document.createTextNode(descriptionText));
	desc.style.height = 'auto';
	desc.style.height = desc.scrollHeight - 20 + 'px';
});