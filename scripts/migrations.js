chrome.storage.local.get(['ctoolhuAuthToken'], function(data) {
	let authToken = data.ctoolhuAuthToken;
	if (!authToken) {
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
	let migrationObjects = await paginate(getAPIEndpoint(), '', authToken);

	for (migration of migrationObjects) {
		if (migration.workflow_state === 'pre_processing') {
			apiCall(`${getAPIEndpoint()}/${migration.id}`, 'PUT', '', authToken);
		}
	}

	alert("Done!");
}