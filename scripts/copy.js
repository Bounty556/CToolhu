chrome.storage.local.get(['ctoolhuAuthToken'], function(data) {
	var authToken = data.ctoolhuAuthToken;
	if (typeof authToken === 'undefined' || authToken == null) {
		alert('No auth token set');
		return;
	}

	var url = document.URL;

	// Find out what item type we're trying to copy, and run the appropriate function
	if (/courses\/\d+\/assignments\/\d+/.test(url))
		copyAssignment(authToken);
	else if (/courses\/\d+\/discussion_topics\/\d+/.test(url))
		copyDiscussion(authToken);
	else if (/courses\/\d+\/pages\/[^\/]+$/.test(url))
		copyPage(authToken);
	else if (/courses\/\d+\/quizzes\/\d+/.test(url))
		copyQuiz(authToken);
	else if (/courses\/\d+\/rubrics\/\d+/.test(url))
		copyRubric(authToken);
	else
		alert("Not a valid item to copy");
});

async function copyAssignment(authToken) {
	copiedData = await paginate(getAPIEndpoint(), '', authToken);
	copiedData.item_type = 'assignment';

	if (copiedData.rubric != null) {
		copiedData.rubric_settings.title = encodeURIComponent(copiedData.rubric_settings.title);
		for (var i = 0; i < copiedData.rubric.length; i++) {
			copiedData.rubric[i].description = encodeURIComponent(copiedData.rubric[i].description);
			copiedData.rubric[i].long_description = encodeURIComponent(copiedData.rubric[i].long_description);
			for (var j = 0; j < copiedData.rubric[i].ratings.length; j++) {
				copiedData.rubric[i].ratings[j].description = encodeURIComponent(copiedData.rubric[i].ratings[j].description);
				copiedData.rubric[i].ratings[j].long_description = encodeURIComponent(copiedData.rubric[i].ratings[j].long_description);
			}
		}
	}
	
	chrome.storage.local.set({'copiedData': copiedData}, function() {
		alert("Item Copied");
	});
}

async function copyDiscussion(authToken) {
	var copiedData = await paginate(getAPIEndpoint(), '', authToken);

	copiedData.item_type = 'discussion';
	copiedData.entries = await paginate(getAPIEndpoint() + '/entries', '', authToken);

	chrome.storage.local.set({'copiedData': copiedData}, function() {
		alert("Item Copied");
	});
}

async function copyPage(authToken) {
	var copiedData = await paginate(getAPIEndpoint(), '', authToken);

	copiedData.item_type = 'page';
	copiedData.title = encodeURIComponent(copiedData.title);
	copiedData.body = encodeURIComponent(copiedData.body);
	copiedData.published = copiedData.published;

	chrome.storage.local.set({'copiedData': copiedData}, function() {
		console.log('Successfully copied item');
	});

	alert("Item Copied");
}

async function copyQuiz(authToken) {
	var copiedData = await paginate(getAPIEndpoint(), '', authToken);

	copiedData.item_type = 'quiz';
	copiedData.questions = await paginate(getAPIEndpoint() + '/questions', '', authToken);
	copiedData.questionGroups = [];

	for (var i = 0; i < copiedData.questions.length; i++) {
		if (copiedData.questions[i].quiz_group_id != null) {
			var group = await paginate(getAPIEndpoint() + '/groups/' + copiedData.questions[i].quiz_group_id, '', authToken);
			copiedData.questionGroups.push(group);
		}
	}

	chrome.storage.local.set({'copiedData': copiedData}, function() {
		alert("Item Copied");
	});
}

async function copyRubric(authToken) {
	var copiedData = await paginate(getAPIEndpoint(), '', authToken);

	copiedData.item_type = 'rubric';

	for (var i = 0; i < copiedData.data.length; i++) {
		copiedData.data[i].description = encodeURIComponent(copiedData.data[i].description);
		copiedData.data[i].long_description = encodeURIComponent(copiedData.data[i].long_description);
		for (var j = 0; j < copiedData.data[i].ratings.length; j++) {
			copiedData.data[i].ratings[j].description = encodeURIComponent(copiedData.data[i].ratings[j].description);
			copiedData.data[i].ratings[j].long_description = encodeURIComponent(copiedData.data[i].ratings[j].long_description);
		}
	}
	
	chrome.storage.local.set({'copiedData': copiedData}, function() {
		alert("Item Copied");
	});
}