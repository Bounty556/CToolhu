$('#ctoolhuImage').on('click', toggleDevConsole);
$('#masquerade').on('click', toggleMasqueradePanel);
$('#showClipboard').on('click', showClipboard);
$('#saveToClipboard').on('click', saveToClipboard);
$('#copyText').on('click', copyClipboardText);

function openDebugPanel() {
	let debugDisplay = document.getElementById('debugging');
	let masqDisplay = document.getElementById('masquerading');
	let miscText = document.getElementById('miscText');

	if (debugDisplay.style.display === 'block') {
		debugDisplay.style.display = 'none';
	 } else {
		updateClipboard(0);
		miscText.style.display = 'none';
		debugDisplay.style.display = 'block';
		masqDisplay.style.display = 'none';
	}
}

document.getElementById('masquerade').addEventListener('click', function() {
	let debugDisplay = document.getElementById('debugging');
	let masqDisplay = document.getElementById('masquerading');

	if (masqDisplay.style.display === 'block') {
		masqDisplay.style.display = 'none';
	 } else {
		masqDisplay.style.display = 'block';
		debugDisplay.style.display = 'none';
	}
});

document.getElementById('showClipboard').addEventListener('click', function() {
	document.getElementById('miscText').innerHTML = 'Loading...';
	document.getElementById('miscText').style.display = 'block';
	updateClipboard(1000);
});

document.getElementById('saveToClipboard').addEventListener('click', function() {
	// First turn what we have in the clipboard
	let stack = document.getElementById('debugLog').innerText.split('\n');

	// Remove empty lines
	stack = stack.filter(word => word.length > 0);

	let data = createJSONObject(stack);

	chrome.storage.local.set({'copiedData': data}, function() {
	 	document.getElementById('miscText').style.display = 'block';
	 	document.getElementById('miscText').innerHTML = 'Saved!';
	});
});

document.getElementById('copyText').addEventListener('click', function() {
	copyText();
});

async function updateClipboard(ms) {
	if (ms != 0)
		await sleep(ms);

	chrome.storage.local.get(['ctoolhuClipboard'], function(data) {
	 	document.getElementById('debugLog').innerHTML = data.ctoolhuClipboard;
		document.getElementById('miscText').style.display = 'none';
	});
}

function copyText() {
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