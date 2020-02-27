async function paginate(url, payload, authToken) {
	var accumulatedData = [];
	var nextLink;

	if (payload.length != 0)
		payload = payload + '&';

	// Initial call
	var call = $.get( {
		url: url,
		data: payload + 'per_page=100',
		beforeSend : function(xhr) {
			xhr.setRequestHeader("Authorization", "Bearer " + authToken);
		}
	})
	.done(function (data, textStatus, jqXHR) {
		if (data.length == null)
			accumulatedData = data;
		else
			for (var i = 0; i < data.length; i++)
				accumulatedData.push(data[i]);

		if (jqXHR.getResponseHeader('link') != null) {
			nextLink = parseLinkHeader(jqXHR.getResponseHeader('link')).next;
		} else {
			nextLink = null;
		}
	})
	.fail(function (jqXHR, textStatus, errorThrown) {
		console.log("Could not process GET request due to error: " + errorThrown);
		nextLink = null;
	});

	await call;

	// Paginated calls
	while (nextLink != null) {
		call = $.get( {
			url: nextLink,
			beforeSend : function(xhr) {
				xhr.setRequestHeader("Authorization", "Bearer " + authToken);
			}
		})
		.done(function (data, textStatus, jqXHR) {
			for (var i = 0; i < data.length; i++)
				accumulatedData.push(data[i]);

			if (jqXHR.getResponseHeader('link') != null) {
				nextLink = parseLinkHeader(jqXHR.getResponseHeader('link')).next;
			} else {
				nextLink = null;
			}
		})
		.fail(function (jqXHR, textStatus, errorThrown) {
			console.log("Could not process GET request due to error: " + errorThrown);
			nextLink = null;
		});

		await call;
	}

	return accumulatedData;
}

function parseLinkHeader(header) {
	var linkStrings = header.split(',');
	var links = {};

	for (var i = 0; i < linkStrings.length; i++)
	{
		var link = linkStrings[i].match(/<([^>]+)>/)[1];
		var name = linkStrings[i].match(/rel="(\w+)"/)[1];

		links[name] = link;
	}

	return links;
}

function apiCall(url, call, payload, authToken) {
	$.ajax( {
			url: url,
			type: call,
			data: payload,
			beforeSend : function(xhr) {
				xhr.setRequestHeader("Authorization", "Bearer " + authToken);
			}
		})
		.fail(function (jqXHR, textStatus, errorThrown) {
			console.log("Could not process " + call + " due to error: " + errorThrown);
		});
}

function getAPIEndpoint() {
	return document.location.origin + '/api/v1' + document.location.pathname;
}