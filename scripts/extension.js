$('#ctoolhuImage').on('click', toggleDevConsole);
$('#masquerade').on('click', toggleMasqueradePanel);
$('#showClipboard').on('click', showClipboard);
$('#saveToClipboard').on('click', saveToClipboard);
$('#copyText').on('click', copyClipboardText);
$('input[name="role"]').on('click', toggleMasqueradeButtons);

function toggleDevConsole() {
	let debugDisplay = $('#debugging');
	let masqDisplay = $('#masquerading');
	let miscText = $('#miscText');

	if (debugDisplay.css('display') === 'block') {
		debugDisplay.css('display', 'none');
	 } else {
		updateClipboard(0);
		debugDisplay.css('display', 'block');
		miscText.css('display', 'none');
		masqDisplay.css('display', 'none');
	}
}

function toggleMasqueradePanel() {
	let debugDisplay = $('#debugging');
	let masqDisplay = $('#masquerading');
	
	if (masqDisplay.css('display') === 'block') {
		masqDisplay.css('display', 'none');
	 } else {
		// Update masquerading data
		chrome.tabs.query({active: true, currentWindow: true}, updateMasqueradingData);

		masqDisplay.css('display', 'block');
		debugDisplay.css('display', 'none');
	}
}

function showClipboard() {
	$('#miscText').text('Loading...');
	$('#miscText').css('display', 'block');
	updateClipboard(1000);
}

function saveToClipboard() {
	// First turn what we have in the clipboard
	let stack = $('#debugLog').text().split('\n');

	// Remove empty lines
	stack = stack.filter(word => word.length > 0);

	let data = createJSONObject(stack);

	chrome.storage.local.set({'copiedData': data}, function() {
		$('#miscText').css('display', 'block');
		$('#miscText').text('Saved!');
	});
}

async function updateClipboard(ms) {
	if (ms != 0)
		await sleep(ms);

	chrome.storage.local.get(['ctoolhuClipboard'], function(data) {
	 	$('#debugLog').html(data.ctoolhuClipboard);
		$('#miscText').css('display', 'none');
	});
}

// Copied code
function copyClipboardText() {
	const element = document.createElement('textarea');
	element.value = document.getElementById('debugLog').innerHTML.replace(/<br>/g, '\n');
	element.setAttribute('readonly', '');
	element.style.position = 'absolute';
	element.style.left = '-9999px';
	document.body.appendChild(element);
	element.select();
	document.execCommand('copy');
	document.body.removeChild(element);
}

function toggleMasqueradeButtons() {
	if ($(this).val() != 'admin') {
		$('#includedAdminRoles').hide();
	} else {
		$('#includedAdminRoles').show();
	}
}

function updateMasqueradingData(tabs) {
	const domain = tabs[0].url.match(/(https?:\/\/[^/]+)\//)[1];

	chrome.storage.local.get(['ctoolhuAuthToken'], function(data) {
		const authToken = data.ctoolhuAuthToken;
		if (!authToken) {
			return;
		}
		$.ajax({
			url: domain,
			method: 'GET',
			beforeSend: xhr => {
				xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
			}
		}).then((data, textStatus, jqxhr) => {
			// Get the id of the user we're masquerading as (if any)
			const masquerading = /users\/\d+\/masquerade/g.test(jqxhr.responseText);

			// If we're actually masquerading
			if (masquerading) {
				// Get the id of the user we're acting as
				const currentUser = jqxhr.responseText.match(/"current_user_id":"([^"]+)/)[1];
				
				$.ajax({
					url: `${domain}/api/v1/users/${currentUser}`,
					method: 'GET',
					beforeSend: function(xhr) {
						xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
					}
				}).then(data => {
					// Update user info in popup window
					$('#masqueradeName').text(data.name);
					$('#masqueradeID').text(currentUser);
					$('#masqueradeSIS').text(data.sis_user_id || '');
					$('#masqueradeUserPage').attr('href', `${domain}/users/${currentUser}`);
					$('#masqueradeImage').attr('src', data.avatar_url);

					$('#currentlyMasquerading').show();
				});
			}
		});
   });
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// Take JSON object formatted as string and turn into JSON object
function createJSONObject(stack) {
	let object = {};
	stack.shift(); // First, remove excess '{'
	stack.pop(); // Then, remove '}'

	while (stack.length > 0) {
		let line = stack.shift().split(/:(.+)?/);

		let key = line[0].trim();

		// If there is nothing past 'key:' then, the next line should be a '{', so this is an object
		let value = (line[1] == null || line[1].trim() == '') ? 'object' : line[1].trim();
		let stringRegex = /^".+"$/;

		// This is a string!
		if (value.match(stringRegex)) {
			value = value.substring(1, value.length - 1);
		} else if (value.toLowerCase() === 'undefined' || value.toLowerCase() === 'null') {
			value = null;
		} else if (value.toLowerCase() === 'true') {
			value = true;
		} else if (value.toLowerCase() === 'false') {
			value = false;
		} else if (!isNaN(value)) {
			value = +value;
		} else if (value.toLowerCase() === 'object') {
			// Remove lines from stack associated with object
			let tempStack = [];
			tempStack.push(stack.shift());
			let bracketCount = 1;
			while (bracketCount > 0) {
				var tempLine = stack.shift();
				if (tempLine.includes('{')) {
					bracketCount++;
				} else if (tempLine.includes('}')) {
					bracketCount--;
				}

				tempStack.push(tempLine);
			}
			value = createJSONObject(tempStack);
		} else {
			console.error(value + " is an invalid value");
			continue;
		}

		object[key] = value;
	}

	return object;
}