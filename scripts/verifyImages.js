chrome.storage.local.get(['ctoolhuAuthToken'], function(data) {
	var authToken = data.ctoolhuAuthToken;
	if (typeof authToken === 'undefined' || authToken == null) {
		alert('No auth token set');
		return;
	}

	// Make sure we're in a course, also grab the course ID
	var regex = document.URL.match(/\/courses\/(\d+)/);

	grabItemDescription(regex[1], authToken);
	
});

async function grabItemDescription(courseID, authToken) {
	// Check if the current item has a description
	var page = await paginate(getAPIEndpoint(), '', authToken);

	if (page.description != null) { // Assignment/Quiz

		//TODO: Check if this is a quiz as well, and check the questions
		var quizID = document.URL.match(/\/courses\/\d+\/quizzes\/(\d+)/);

		if (quizID != null && quizID[1] != null) {
			var quizQuestions = await paginate(getAPIEndpoint() + '/questions', '', authToken);
		} else {
			
		}
	} else if (page.message != null) { // Discussion
		
	} else if (page.body != null) { // Page
		
	}
}

function findInvalidImages(html) {
	
}