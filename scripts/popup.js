chrome.tabs.executeScript(null, {
	file: 'scripts/jquery-3.3.1.min.js'
});
chrome.tabs.executeScript(null, {
	file: 'scripts/utilities.js'
});
chrome.tabs.executeScript(null, {
	file: 'scripts/jobsQueue.js'
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

function getClipboardHandler() {
	chrome.tabs.executeScript(null, {
		file: 'scripts/getClipboard.js'
	});
}

// Add button listeners
document.getElementById('setAuth').addEventListener('click', setAuth);
document.getElementById('getAuth').addEventListener('click', getAuth);
document.getElementById('clearMigrations').addEventListener('click', migrationsHandler);
document.getElementById('splunkSearch').addEventListener('click', splunkHandler);
document.getElementById('copy').addEventListener('click', copyHandler);
document.getElementById('paste').addEventListener('click', pasteHandler);
document.getElementById('showClipboard').addEventListener('click', getClipboardHandler);

// Button functions
function setAuth() {
	let tempAuth = prompt('Please enter your authToken:', '');

	if (tempAuth != null)
	{
		chrome.storage.local.set({'ctoolhuAuthToken': tempAuth}, function() {
			console.log('Successfully stored auth token');
		});
	}
}

function getAuth() {
	chrome.storage.local.get(['ctoolhuAuthToken'], function(data) {
		let authToken = data.ctoolhuAuthToken;
		if (typeof authToken === 'undefined' || authToken == null) {
			alert('No auth token set');
		} else {
			alert(authToken);
		}
	});
}