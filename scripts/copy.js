chrome.storage.local.get(['ctoolhuAuthToken'], data => {
	const authToken = data.ctoolhuAuthToken;
	if (!authToken) {
		alert('No auth token set');
		return;
	}

	const url = document.URL;

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

// Grabs the assignment object anad stores it in copiedData.
async function copyAssignment(authToken) {
	let copiedData = (await paginate(getAPIEndpoint(), '', authToken))[0];
	copiedData.item_type = 'assignment';

	// If this assignment has a rubric

	if (copiedData.rubric) {
		copiedData.rubric_settings.title = encodeURIComponent(copiedData.rubric_settings.title);

		copiedData.rubric = copiedData.rubric.map(criterion => {
			criterion.description = encodeURIComponent(criterion.description);
			criterion.long_description = encodeURIComponent(criterion.long_description);
	
			criterion.ratings = criterion.ratings.map(rating => {
				rating.description = encodeURIComponent(rating.description);
				rating.long_description = encodeURIComponent(rating.long_description);
				
				return rating;
			});
	
			return criterion;
		});
	}
	
	chrome.storage.local.set({'copiedData': copiedData}, () => {
		alert("Item Copied");
	});
}

// Grabs the discussion object and stores it in copiedData
async function copyDiscussion(authToken) {
	let copiedData = (await paginate(getAPIEndpoint(), '', authToken))[0];

	copiedData.item_type = 'discussion';

	// Copy each of the discussion's entries
	copiedData.entries = await paginate(`${getAPIEndpoint()}/entries`, '', authToken);

	// If this discussion has an assoociated rubric
	if (copiedData.assignment && copiedData.assignment.rubric) {
		copiedData.assignment.rubric_settings.title = encodeURIComponent(copiedData.assignment.rubric_settings.title);

		copiedData.assignment.rubric = copiedData.assignment.rubric.map(criterion => {
			criterion.description = encodeURIComponent(criterion.description);
			criterion.long_description = encodeURIComponent(criterion.long_description);
	
			criterion.ratings = criterion.ratings.map(rating => {
				rating.description = encodeURIComponent(rating.description);
				rating.long_description = encodeURIComponent(rating.long_description);
				
				return rating;
			});
	
			return criterion;
		});
	}

	chrome.storage.local.set({'copiedData': copiedData}, () => {
		alert("Item Copied");
	});
}

// Grabs the page object and stores it in copiedData
async function copyPage(authToken) {
	let copiedData = (await paginate(getAPIEndpoint(), '', authToken))[0];

	copiedData.item_type = 'page';
	copiedData.title = encodeURIComponent(copiedData.title);
	copiedData.body = encodeURIComponent(copiedData.body);
	copiedData.published = copiedData.published;

	chrome.storage.local.set({'copiedData': copiedData}, () => {
		console.log('Successfully copied item');
	});

	alert("Item Copied");
}

// Grabs the quiz object and stores it in copiedData
async function copyQuiz(authToken) {
	let copiedData = (await paginate(getAPIEndpoint(), '', authToken))[0];

	copiedData.item_type = 'quiz';

	// Grabs the questions in this quiz and stores them in copiedData.questions
	copiedData.questions = await paginate(`${getAPIEndpoint()}/questions`, '', authToken);

	let groupIdList = [];

	// Grab all question groups in this quiz
	copiedData.question_groups = [];
	for (question of copiedData.questions) {
		if (!groupIdList.includes(question.quiz_group_id)) {
			groupIdList.push(question.quiz_group_id);
		}
	}
	
	let receivedGroupCount = 0;
	
	for (groupId of groupIdList) {
		paginate(`${getAPIEndpoint()}/groups/${groupId}`, '', authToken).then(data => {
			copiedData.question_groups.push(data[0]);
			receivedGroupCount++;
		});
	}

	// Wait until all groups are grabbed
	while (receivedGroupCount < groupIdList.length) {
		await sleep(25);
	}

	chrome.storage.local.set({'copiedData': copiedData}, () => {
		alert('Item Copied');
	});
}

// Grabs a rubric object and stores it in copiedData
async function copyRubric(authToken) {
	let copiedData = (await paginate(getAPIEndpoint(), '', authToken))[0];

	copiedData.item_type = 'rubric';

	copiedData.data.map(criterion => {
		criterion.description = encodeURIComponent(criterion.description);
		criterion.long_description = encodeURIComponent(criterion.long_description);

		criterion.ratings.map(rating => {
			rating.description = encodeURIComponent(rating.description);
			rating.long_description = encodeURIComponent(rating.long_description);
			
			return rating;
		});

		return criterion;
	});
	
	chrome.storage.local.set({'copiedData': copiedData}, () => {
		alert("Item Copied");
	});
}