document.getElementById('ctoolhuImage').addEventListener('click', function() {
	var display = document.getElementById('debugging').style.display;

	if (display === 'block') {
		document.getElementById('debugging').style.display = 'none';
	 } else {
		updateLog(0);
		document.getElementById('miscText').style.display = 'none';
		document.getElementById('debugging').style.display = 'block';
	}
});

document.getElementById('showCopied').addEventListener('click', function() {
	document.getElementById('miscText').innerHTML = 'Loading...';
	document.getElementById('miscText').style.display = 'block';
	updateLog(1000);
});

async function updateLog(ms) {
	if (ms != 0)
		await sleep(ms);

	chrome.storage.local.get(['ctoolhuClipboard'], function(data) {
	 	document.getElementById('debugLog').innerHTML = data.ctoolhuClipboard;
		document.getElementById('miscText').style.display = 'none';
	});
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}