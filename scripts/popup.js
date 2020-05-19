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

function getClipboardHandler() {
	chrome.tabs.executeScript(null, {
		file: 'scripts/getClipboard.js'
	});
}

function actAsRandomHandler() {
	chrome.tabs.executeScript(null, {
		file: 'scripts/actAsRandom.js'
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
document.getElementById('ctoolhuImage').addEventListener('click', getClipboardHandler);
document.getElementById('actAsRandom').addEventListener('click', setActAsRandomOptions);

// Button functions
function setAuth() {
	let tempAuth = prompt('Please enter your authToken:', '');

	if (tempAuth)
	{
		chrome.storage.local.set({'ctoolhuAuthToken': tempAuth}, () => {
			console.log('Successfully stored auth token');

			$.ajax({
				url: 'https://siteadmin.instructure.com/',
				method: 'GET',
				beforeSend: xhr => {
					xhr.setRequestHeader('Authorization', `Bearer ${tempAuth}`);
				}
			}).then((data, textStatus, jqXHR) => {
				// Also set our real user id using the token we gave
				chrome.storage.local.set({'ctoolhuRealUserID': jqXHR.getResponseHeader('x-canvas-user-id')}, () => {});
			});
		});
	}
}

function getAuth() {
	chrome.storage.local.get(['ctoolhuAuthToken'], data => {
		let authToken = data.ctoolhuAuthToken;
		if (authToken) {
			alert(authToken);
		} else {
			alert('No auth token set');
		}
	});
}

function setActAsRandomOptions() {
	const chosenRole = document.querySelector('input[name="role"]:checked');
	const adminRoles = document.querySelectorAll('input[name="includedRoles"]:checked');
	
	const masqObject = {
		role: chosenRole.value,
		includedRoles: []
	}

	for (role of adminRoles) {
		masqObject.includedRoles.push(role.value);
	}

	// Set masqObject as our current masquerading options
	chrome.storage.local.set({'masqueradingOptions': masqObject}, () => {
		actAsRandomHandler();
	});
}