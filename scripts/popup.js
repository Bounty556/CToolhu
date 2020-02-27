chrome.tabs.executeScript(null, {
	file: 'scripts/jquery-3.3.1.min.js'
});
chrome.tabs.executeScript(null, {
	file: 'scripts/utilities.js'
});

// Functions to inject scripts
function migrationsHandler() {
	chrome.tabs.executeScript(null, {
		file: 'scripts/migrations.js'
	});
}

function splunkHandler() {
	chrome.tabs.executeScript(null, {
		file: 'scripts/splunk.js'
	});
}


function copyHandler() {
	chrome.tabs.executeScript(null, {
		file: 'scripts/copy.js'
	});
}

function pasteHandler() {
	chrome.tabs.executeScript(null, {
		file: 'scripts/paste.js'
	});
}

function verifyImagesHandler() {
	chrome.tabs.executeScript(null, {
		file: 'scripts/verifyImages.js'
	});
}

// Add button listeners
document.addEventListener('DOMContentLoaded', function () {
	document.getElementById('setAuth').addEventListener('click', setAuth);
});

document.addEventListener('DOMContentLoaded', function () {
	document.getElementById('getAuth').addEventListener('click', getAuth);
});

document.addEventListener('DOMContentLoaded', function () {
	document.getElementById('clearMigrations').addEventListener('click', migrationsHandler);
});

document.addEventListener('DOMContentLoaded', function () {
	document.getElementById('splunkSearch').addEventListener('click', splunkHandler);
});

document.addEventListener('DOMContentLoaded', function () {
	document.getElementById('copy').addEventListener('click', copyHandler);
});

document.addEventListener('DOMContentLoaded', function () {
	document.getElementById('paste').addEventListener('click', pasteHandler);
});

document.addEventListener('DOMContentLoaded', function () {
	document.getElementById('verifyImages').addEventListener('click', verifyImagesHandler);
});

// Button functions
function setAuth() {
	var tempAuth = prompt('Please enter your authToken:', '');

	if (tempAuth != null)
	{
		chrome.storage.local.set({'ctoolhuAuthToken': tempAuth}, function() {
			console.log('Successfully stored auth token');
		});
	}
}

function getAuth() {
	chrome.storage.local.get(['ctoolhuAuthToken'], function(data) {
		var authToken = data.ctoolhuAuthToken;
		if (typeof authToken === 'undefined' || authToken == null) {
			alert('No auth token set');
		} else {
			alert(authToken);
		}
	});
}