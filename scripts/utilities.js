async function paginate(url, payload, authToken, nextLink = null) {
	let accumulatedData = [];
	let linkHeader = null;

	let call = $.ajax({
		url: (nextLink) ? nextLink : `${url}?per_page=100&${payload}`,
		method: 'GET',
		beforeSend: function(xhr) {
			xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
		}
	}).then((data, textStatus, jqXHR) => {
		// This API may only return an object, in which case it will not return it as an array
		if (data.length) {
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
			console.log('loop');
			const result = await paginate(url, payload, authToken, nextLink);
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
		beforeSend : xhr => {
			xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
		}
	});

	return result;
}

function getAPIEndpoint() {
	return `${document.location.origin}/api/v1${document.location.pathname}`;
}