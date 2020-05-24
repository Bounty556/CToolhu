// This is the hackiest thing I've ever written in my life
async function paginate(url, payload, authToken, nextLink = null, realUserID = null) {
	let accumulatedData = [];
	let linkHeader = null;
	var lock = true;
	const lockLimit = 10;
	let currentLockAttempt = 0;

	if (!realUserID) {
		chrome.storage.local.get(['ctoolhuRealUserID'], data => {
			realUserID = data.ctoolhuRealUserID;
			lock = false;
		});
	}
	
	// Spinlock while waiting for storage
	while (lock && currentLockAttempt < lockLimit) {
		await sleep(50);
		currentLockAttempt++;
	}

	let call = $.ajax({
		url: (nextLink) ? nextLink : `${url}?per_page=100&${payload}&as_user_id=${realUserID}`,
		method: 'GET',
		beforeSend: function(xhr) {
			xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
		}
	}).then((data, textStatus, jqXHR) => {
		// This API may only return a single object
		if (Array.isArray(data)) {
			accumulatedData.push(...data);
		} else {
			accumulatedData.push(data);
		}

		linkHeader = jqXHR.getResponseHeader('link');
	});

	await call;

	// Look for 'next' header link
	if (linkHeader) {
		nextLink = parseLinkHeader(linkHeader).next;
		
		if (nextLink) {
			const result = await paginate(url, payload, authToken, nextLink, realUserID);
			accumulatedData.push(...result);
		}
	}

	return accumulatedData;
}

function parseLinkHeader(header) {
	const linkStrings = header.split(',');
	let links = {};

	for (linkString of linkStrings) {
		const link = linkString.match(/<([^>]+)>/)[1];
		const name = linkString.match(/rel="(\w+)"/)[1];
		
		links[name] = link;
	}

	return links;
}

function apiCall(url, call, payload, authToken) {
	const result = $.ajax( {
		url: `${url}?${payload}`,
		method: call,
		beforeSend: xhr => {
			xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
		}
	});

	return result;
}

// Makes use of Exponential Backoff to ensure that the call runs without being rate limited
async function ensureResults(url, call, payload, authToken, waitTime = 25) {
	let results = null;
	try {
		results = await apiCall(url, call, payload, authToken);
	} catch (err) {
		if (err.status === 403) {
			await sleep(waitTime);
			results = await ensureResults(url, call, payload, authToken, waitTime * 2);
		} else {
			return null;
		}
	}
	return results;
}

function getAPIEndpoint() {
	let path = document.location.pathname.match(/(\/api\/v1)?(.+)/)[2];
	path = path.replace(/\/edit/, '');

	console.log(path);

	return `${document.location.origin}/api/v1${path}`;
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function capitalize(string) {
	if (typeof string != 'string' || string.length === 0) {
		return string;
	}

	return string.charAt(0).toUpperCase() + string.substr(1, string.length - 1);
}