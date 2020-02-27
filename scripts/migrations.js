chrome.storage.local.get(['ctoolhuAuthToken'], function(data) {
	var authToken = data.ctoolhuAuthToken;
	if (typeof authToken === 'undefined' || authToken == null) {
		alert('No auth token set');
		return;
	}

	// Make sure we're on the Content Migrations page first
	if (!/\/content_migrations$/.test(document.URL))
	{
		alert("This tool only works on the Content Migrations page");
		return;
	}

	clearMigrations(authToken);
});

async function clearMigrations(authToken) {
	var migrationObjects = await paginate(getAPIEndpoint(), '', authToken);

	for (var i = 0; i < migrationObjects.length; i++)
	{
		if (migrationObjects[i].workflow_state == 'pre_processing')
		{
			apiCall(getAPIEndpoint() + '/' + migrationObjects[i].id, 'PUT', '', authToken);
		}
	}

	alert("Done!");
}