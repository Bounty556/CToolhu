chrome.storage.local.get(['ctoolhuAuthToken'], function(data) {
	var authToken = data.ctoolhuAuthToken;
	if (typeof authToken === 'undefined' || authToken == null) {
		alert('No auth token set');
		return;
	}

	// Make sure we're in a course, also grab the course ID
	var regex = document.URL.match(/\/courses\/(\d+)/);

	if (regex != null)
	{
		var courseID = regex[1];

		// Grab copied data
		chrome.storage.local.get(['copiedData'], function (data) {
			var copiedData = data.copiedData;
			if (typeof copiedData === 'undefined' || copiedData == null) {
				alert('No item copied');
			} else {
				var itemType = copiedData.item_type;
				if (itemType == 'assignment')
					pasteAssignment(copiedData, courseID, authToken);
				else if (itemType == 'discussion')
					pasteDiscussion(copiedData, courseID, authToken);
				else if (itemType == 'page')
					pastePage(copiedData, courseID, authToken);
				else if (itemType == 'quiz')
					pasteQuiz(copiedData, courseID, authToken);
				else
					alert("Copied item is corrupted, please re-copy");
			}
		});
	} else {
		alert("This tool only works inside of a course");
	}
});

async function pasteAssignment(copiedData, courseID, authToken) {
	// Consolidate payload
	var payload = '';

	var entries = Object.entries(copiedData);

	for (var i = 0; i < entries.length; i++) {
		switch(entries[i][0]) {
			case 'submission_types':
				for (var j = 0; j < entries[i][1].length; j++) {
					payload = payload.concat('assignment[' + entries[i][0] + '][]=' + entries[i][1][j] + '&');
				}
				break;
			case 'allowed_extensions':
				payload = payload.concat('assignment[' + entries[i][0] + ']=');

				if (entries[i][1].length != null) {
					for (var j = 0; j < entries[i][1].length; j++) {
						payload = payload.concat(entries[i][1][j] + ',');
					}

					// Get rid of extra comma
					payload = payload.substr(0, payload.length - 1);
				} else {
					payload = payload.concat(entries[i][1]);
				}

				payload = payload.concat('&');
				break;
			case 'external_tool_tag_attributes':
				payload = payload.concat('assignment[' + entries[i][0] + '][url]=' + entries[i][1].url + '&');
				payload = payload.concat('assignment[' + entries[i][0] + '][new_tab]=' + entries[i][1].new_tab + '&');
				break;
			case 'item_type':
			case 'use_rubric_for_grading':
			case 'rubric':
			case 'rubric_settings':
				break;
			default:
				if (entries[i][1] != null)
					payload = payload.concat('assignment[' + entries[i][0] + ']=' + entries[i][1] + '&');
		}
	}

	// Get rid of extra '&'
	payload = payload.substr(0, payload.length - 1);

	var assignment = await apiCall(document.location.origin + '/api/v1/courses/' + courseID + '/assignments', 'POST', payload, authToken);

	if (copiedData.rubric == null || copiedData.rubric_settings == null) {
		alert("Done!");
		return;
	}

	// Create rubric
	payload = 'rubric[title]=' + copiedData.rubric_settings.title + '&rubric[points_possible]=' + copiedData.rubric_settings.points_possible + '&rubric_association[use_for_grading]=' + copiedData.use_rubric_for_grading + '&rubric_association[hide_score_total]=' + copiedData.rubric_settings.hide_score_total + '&rubric_association[hide_points]=' + copiedData.rubric_settings.hide_points + '&rubric_association[hide_outcome_results]=false' + '&rubric[free_form_criterion_comments]=' + copiedData.rubric_settings.free_form_criterion_comments + '&rubric_id=new&rubric_association[association_type]=Assignment&rubric_association[association_id]=' + assignment.id + '&rubric_association[purpose]=grading&skip_updating_points_possible=false';

	// For each criterion
	for (var i = 0; i < copiedData.rubric.length; i++) {

		var rubricEntries = Object.entries(copiedData.rubric[i]);
		var ratingCount = 0;
		// For each key in criterion
		for (var j = 0; j < rubricEntries.length; j++) {
			switch (rubricEntries[j][0]) {
				case 'id':
					break;
				case 'ratings':
					var ratings = rubricEntries[j][1];

					// For each rating in criterion
					for (var k = 0; k < ratings.length; k++) {
						var ratingEntries = Object.entries(ratings[k]);
						// For each key in rating in criterion
						for (var h = 0; h < ratingEntries.length; h++) {
							if (ratingEntries[h][1] != null && ratingEntries[h][0] != 'id') {
								payload = payload.concat('&rubric[criteria][' + i + '][ratings][' + k + '][' + ratingEntries[h][0] + ']=' + ratingEntries[h][1]);
							}
						}
					}
					ratingCount++;
					break;
				default:
					if (rubricEntries[j][1] != null)
						payload = payload.concat('&rubric[criteria][' + i + '][' + rubricEntries[j][0] + ']=' + rubricEntries[j][1]);
			}
		}
	}

	var rubric = await apiCall(document.location.origin + '/api/v1/courses/' + courseID + '/rubrics', 'POST', payload, authToken);

	alert("Done!");
}

function pasteDiscussion(copiedData, courseID, authToken) {
	alert('pasting discussion');
}

async function pastePage(copiedData, courseID, authToken) {
	// Consolidate payload
	var payload = '';

	var entries = Object.entries(copiedData);

	for (var i = 0; i < entries.length; i++) {
		switch(entries[i][0]) {
			default:
				if (entries[i][1] != null)
					payload = payload.concat('wiki_page[' + entries[i][0] + ']=' + entries[i][1] + '&');
		}
	}

	// Get rid of extra '&'
	payload = payload.substr(0, payload.length - 1);

	console.log(payload);

	await apiCall(document.location.origin + '/api/v1/courses/' + courseID + '/pages', 'POST', payload, authToken);

	alert("Done!");
}

function pasteQuiz(copiedData, courseID, authToken) {
	alert('pasting quiz');
}