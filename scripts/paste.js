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

	var normalParams = ['peer_reviews', 'automatic_peer_reviews', 'grade_group_students_individually', 'points_possible', 'grading_type', 'due_at', 'lock_at', 'unlock_at', 'external_tool_tag_attributes', 'only_visible_to_overrides', 'published', 'omit_from_final_grade', 'quiz_lti', 'moderated_grading', 'grader_comments_visible_to_graders', 'graders_anonymous_to_graders', 'graders_names_visible_to_graders', 'anonymous_grading'];
	var specialParams = ['name', 'description'];

	for (var i = 0; i < normalParams.length; i++) {
		if (copiedData[normalParams[i]] != null)
			payload = payload.concat('assignment[' + normalParams[i] + ']=' + copiedData[normalParams[i]] + '&');
	}

	for (var i = 0; i < specialParams.length; i++) {
		if (copiedData[specialParams[i]] != null)
			payload = payload.concat('assignment[' + specialParams[i] + ']=' + copiedData[specialParams[i]] + '&');
	}

	if (copiedData.submission_types != null) {
		for (var i = 0; i < copiedData.submission_types.length; i++) {
			payload = payload.concat('assignment[submission_types][]=' + copiedData.submission_types[i] + '&');
		}
	}
	
	if (copiedData.allowed_extensions != null) {
		for (var i = 0; i < copiedData.allowed_extensions.length; i++) {
			payload = payload.concat('assignment[allowed_extensions][]=' + copiedData.allowed_extensions[i] + '&');
		}
	}

	if (copiedData.external_tool_tag_attributes != null) {
		payload = payload.concat('assignment[external_tool_tag_attributes][url]=' + copiedData.external_tool_tag_attributes.url + '&');
		payload = payload.concat('assignment[external_tool_tag_attributes][new_tab]=' + copiedData.external_tool_tag_attributes.new_tab + '&');
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
					if (rubricEntries[j][1] != null) {
						payload = payload.concat('&rubric[criteria][' + i + '][' + rubricEntries[j][0] + ']=' + rubricEntries[j][1]);
					}
			}
		}
	}

	await apiCall(document.location.origin + '/api/v1/courses/' + courseID + '/rubrics', 'POST', payload, authToken);

	alert("Done!");
}

async function pasteDiscussion(copiedData, courseID, authToken) {
	var payload = '';

	normalParams = ['discussion_type', 'published', 'delayed_post_at', 'allow_rating', 'lock_at', 'podcast_enabled', 'podcast_has_student_posts', 'require_initial_post', 'is_announcement', 'pinned', 'only_graders_can_rate', 'sort_by_rating'];
	specialParams = ['title', 'message'];

	for (var i = 0; i < normalParams.length; i++) {
		if (copiedData[normalParams[i]] != null)
			payload = payload.concat(normalParams[i] + '=' + copiedData[normalParams[i]] + '&');
	}

	for (var i = 0; i < specialParams.length; i++) {
		if (copiedData[specialParams[i]] != null)
			payload = payload.concat(specialParams[i] + '=' + encodeURIComponent(copiedData[specialParams[i]]) + '&');
	}

	// Add assignment object
	if (copiedData.assignment != null) {

		var normalParams = ['peer_reviews', 'automatic_peer_reviews', 'grade_group_students_individually', 'points_possible', 'grading_type', 'due_at', 'lock_at', 'unlock_at', 'only_visible_to_overrides', 'published', 'omit_from_final_grade', 'moderated_grading', 'grader_comments_visible_to_graders', 'graders_anonymous_to_graders', 'graders_names_visible_to_graders', 'anonymous_grading'];

		for (var i = 0; i < normalParams.length; i++) {
			if (copiedData.assignment[normalParams[i]] != null)
				payload = payload.concat('assignment[' + normalParams[i] + ']=' + copiedData.assignment[normalParams[i]] + '&');
		}
	}

	payload = payload.substr(0, payload.length - 1);

	var discussion = await apiCall(document.location.origin + '/api/v1/courses/' + courseID + '/discussion_topics', 'POST', payload, authToken);

	// Add entries
	for (var i = 0; i < copiedData.entries.length; i++) {
		var entry = apiCall(document.location.origin + '/api/v1/courses/' + courseID + '/discussion_topics/' + discussion.id + '/entries', 'POST', 'message=' + encodeURIComponent(copiedData.entries[i].message), authToken);

		// Add recent replies to entries
		if (copiedData.entries[i].recent_replies != null) {
			addEntryReplies(entry, copiedData.entries[i].recent_replies, document.location.origin + '/api/v1/courses/' + courseID + '/discussion_topics/' + discussion.id + '/entries', authToken);
		}
	}

	alert("Done!");
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
	var specialParams = ['question_name', 'question_text', 'correct_comments_html', 'incorrect_comments_html', 'neutral_comments_html', 'text_after_answers', 'answer_tolerance', 'matching_answer_incorrect_matches'];

	var normalAnsParams = ['numerical_answer_type', 'match_id'];
	var	specialAnsParams = ['text', 'comments_html', 'name', 'blank_id'];

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

			if (question.answers[j].answer != null) {
				payload = payload.concat('question[answers][' + j + '][answer_text]=' + question.answers[j].answer + '&');
			}

			if (question.answers[j].exact != null) {
				payload = payload.concat('question[answers][' + j + '][answer_exact]=' + question.answers[j].exact + '&');
			}

			if (question.answers[j].margin != null) {
				payload = payload.concat('question[answers][' + j + '][answer_error_margin]=' + question.answers[j].margin + '&');
			}

			if (question.answers[j].start != null) {
				payload = payload.concat('question[answers][' + j + '][answer_range_start]=' + question.answers[j].start + '&');
			}

			if (question.answers[j].end != null) {
				payload = payload.concat('question[answers][' + j + '][answer_range_end]=' + question.answers[j].end + '&');
			}

			if (question.answers[j].approximate != null) {
				payload = payload.concat('question[answers][' + j + '][answer_approximate]=' + question.answers[j].approximate + '&');
			}

			if (question.answers[j].precision != null) {
				payload = payload.concat('question[answers][' + j + '][answer_precision]=' + question.answers[j].precision + '&');
			}

			if (question.answers[j].left != null) {
				payload = payload.concat('question[answers][' + j + '][answer_match_left]=' + encodeURIComponent(question.answers[j].left) + '&');
			}

			if (question.answers[j].right != null) {
				payload = payload.concat('question[answers][' + j + '][answer_match_right]=' + encodeURIComponent(question.answers[j].right) + '&');
			}

			if (question.answers[j].comments_html != null) {
				payload = payload.concat('question[answers][' + j + '][answer_comment_html]=' + encodeURIComponent(question.answers[j].comments_html) + '&');
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

	payload = payload.concat('rubric_association[purpose]=bookmark&rubric_association[association_type]=Course&rubric_association[association_id]=' + courseID + '&rubric[title]=' + encodeURIComponent(copiedData.title) + '&rubric[free_form_criterion_comments]=' + copiedData.free_form_criterion_comments);

	var normalParams = [''];

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

async function addEntryReplies(promisedEntry, replies, URL, authToken) {
	var entry = await promisedEntry;

	for (var i = 0; i < replies.length; i++) {
		apiCall(URL + '/' + entry.id + '/replies', 'POST', 'message=' + encodeURIComponent(replies[i].message), authToken);
	}
}