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
				else if (itemType == 'rubric')
					pasteRubric(copiedData, courseID, authToken);
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
	// If you don't include rubric_id=new in the payload, this will just be absolutely broken. I spent like 12 hours on this because it's not mentioned anywhere in our docs
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

	await apiCall(document.location.origin + '/api/v1/courses/' + courseID + '/rubrics', 'POST', payload, authToken);

	alert("Done!");
}

async function pasteDiscussion(copiedData, courseID, authToken) {
	alert('pasting discussion');
}

async function pastePage(copiedData, courseID, authToken) {
	// Consolidate payload
	var payload = '';

	var entries = Object.entries(copiedData);

	for (var i = 0; i < entries.length; i++) {
		switch(entries[i][0]) {
			case 'item_type':
				break;
			default:
				if (entries[i][1] != null)
					payload = payload.concat('wiki_page[' + entries[i][0] + ']=' + entries[i][1] + '&');
		}
	}

	// Get rid of extra '&'
	payload = payload.substr(0, payload.length - 1);

	await apiCall(document.location.origin + '/api/v1/courses/' + courseID + '/pages', 'POST', payload, authToken);

	alert("Done!");
}

async function pasteQuiz(copiedData, courseID, authToken) {

	var normalParams = ['quiz_type', 'assignment_group_id', 'time_limit', 'shuffle_answers', 'hide_results', 'show_correct_answers', 'show_correct_answers_last_attempt', 'show_correct_answers_at', 'hide_correct_answers_at', 'allowed_attempts', 'scoring_policy', 'one_question_at_a_time', 'cant_go_back', 'access_code', 'ip_filter', 'due_at', 'lock_at', 'unlock_at', 'published', 'one_time_results', 'only_visible_to_overrides'];
	var specialParams = ['title', 'description'];

	// Consolidate payload
	var payload = '';

	for (var i = 0; i < normalParams.length; i++) {
		if (copiedData[normalParams[i]] != null) {
			if (specialParams.includes(normalParams[i]))
				payload = payload.concat('quiz[' + normalParams[i] + ']=' + encodeURIComponent(copiedData[normalParams[i]]) + '&');
			else
				payload = payload.concat('quiz[' + normalParams[i] + ']=' + copiedData[normalParams[i]] + '&');
		}
	}

	for (var i = 0; i < specialParams.length; i++) {
		if (copiedData[specialParams[i]] != null) {
			payload = payload.concat('quiz[' + specialParams[i] + ']=' + encodeURIComponent(copiedData[specialParams[i]]) + '&');	
		}
	}

	// Get rid of extra '&'
	payload = payload.substr(0, payload.length - 1);

	var quiz = await apiCall(document.location.origin + '/api/v1/courses/' + courseID + '/quizzes', 'POST', payload, authToken);

	// Map question groups in original quiz to groups in new quiz
	var groupIDMap = {};
	for (var i = 0; i < copiedData.questionGroups.length; i++) {
		payload = 'quiz_groups[][name]=' + copiedData.questionGroups[i].name + '&quiz_groups[][pick_count]=' + copiedData.questionGroups[i].pick_count + '&quiz_groups[][question_points]=' + copiedData.questionGroups[i].question_points;

		var group = await apiCall(document.location.origin + '/api/v1/courses/' + courseID + '/quizzes/' + quiz.id + '/groups', 'POST', payload, authToken);

		// https://canvas.instructure.com/doc/api/quiz_question_groups.html#method.quizzes/quiz_groups.create
		groupIDMap[copiedData.questionGroups[i].id] = group.quiz_groups[0].id;
	}

	// Add questions to quiz
	var normalParams = ['question_type', 'position', 'points_possible', 'formula_decimal_places'];
	var specialParams = ['question_name', 'question_text', 'correct_comments', 'incorrect_comments', 'neutral_comments', 'text_after_answers', 'answer_tolerance', 'matching_answer_incorrect_matches'];

	var normalAnsParams = ['answer', 'exact', 'margin', 'numerical_answer_type', 'match_id'];
	var	specialAnsParams = ['text', 'comments', 'name', 'left', 'right', 'blank_id'];

	for (var i = 0; i < copiedData.questions.length; i++) {
		var question = copiedData.questions[i];

		payload = '';

		for (var j = 0; j < normalParams.length; j++) {
			if (question[normalParams[j]] != null) {
				payload = payload.concat('question[' + normalParams[j] + ']=' + question[normalParams[j]] + '&');
			}
		}

		for (var j = 0; j < specialParams.length; j++) {
			if (question[specialParams[j]] != null) {
				payload = payload.concat('question[' + specialParams[j] + ']=' + encodeURIComponent(question[specialParams[j]]) + '&');
			}
		}

		// Check for the 'variables' param
		if (question.variables != null) {
			for (var j = 0; j < question.variables.length; j++) {
				payload = payload.concat('question[variables][' + j + '][name]=' + encodeURIComponent(question.variables[j].name) + '&question[variables][' + j + '][min]=' + question.variables[j].min + '&question[variables][' + j + '][max]=' + question.variables[j].max + '&question[variables][' + j + '][scale]=' + question.variables[j].scale + '&');
			}
		}

		// Check for the 'formulas' param
		if (question.formulas != null) {
			for (var j = 0; j < question.formulas.length; j++) {
				payload = payload.concat('question[formulas][]=' + encodeURIComponent(question.formulas[j].formula) + '&');
			}
		}

		// Check for the 'matches' param
		if (question.matches != null) {
			for (var j = 0; j < question.matches.length; j++) {
				payload = payload.concat('question[matches][' + j + '][text]=' + encodeURIComponent(question.matches[j].text) + '&question[matches][' + j + '][match_id]=' + question.matches[j].match_id);
			}
		}

		// Put question in group ID if valid
		if (question.quiz_group_id != null && groupIDMap[question.quiz_group_id] != null)
			payload = payload.concat('question[quiz_group_id]=' + groupIDMap[question.quiz_group_id] + '&');

		// Add answers to question
		
		for (var j = 0; j < question.answers.length; j++) {

			if (question.answers[j].weight != null) {
				payload = payload.concat('question[answers][' + j + '][answer_weight]=' + question.answers[j].weight + '&');
			}

			for (var k = 0; k < normalAnsParams.length; k++) {
				if (question.answers[j][normalAnsParams[k]] != null)
					payload = payload.concat('question[answers][' + j + '][' + normalAnsParams[k] + ']=' + question.answers[j][normalAnsParams[k]] + '&');
			}

			for (var k = 0; k < specialAnsParams.length; k++) {
				if (question.answers[j][specialAnsParams[k]] != null)
					payload = payload.concat('question[answers][' + j + '][' + specialAnsParams[k] + ']=' + encodeURIComponent(question.answers[j][specialAnsParams[k]]) + '&');
			}

			// // Check for the 'variables' param
			if (question.answers[j].variables != null) {
				for (var k = 0; k < question.answers[j].variables.length; k++) {
					payload = payload.concat('question[answers][' + j + '][variables][' + k + '][name]=' + encodeURIComponent(question.answers[j].variables[k].name) + '&question[answers][' + j + '][variables][' + k + '][value]=' + question.answers[j].variables[k].value + '&');
				}
			}
		}

		payload = payload.substr(0, payload.length - 1);

		apiCall(document.location.origin + '/api/v1/courses/' + courseID + '/quizzes/' + quiz.id + '/questions', 'POST', payload, authToken);

		console.log(payload);
	}

	alert('Done');
}

async function pasteRubric(copiedData, courseID, authToken) {
	// Consolidate payload
	var payload = '';

	payload = payload.concat('rubric_association[purpose]=bookmark&rubric_association[association_type]=Course&rubric_association[association_id]=' + courseID + '&rubric[title]=' + copiedData.title + '&rubric[free_form_criterion_comments]=' + copiedData.free_form_criterion_comments);

	// For each criterion
	for (var i = 0; i < copiedData.data.length; i++) {

		var rubricEntries = Object.entries(copiedData.data[i]);
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

	console.log(payload);

	await apiCall(document.location.origin + '/api/v1/courses/' + courseID + '/rubrics', 'POST', payload, authToken);

	alert("Done!");
}