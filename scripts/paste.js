chrome.storage.local.get(['ctoolhuAuthToken', 'validSiteList'], data => {
	let authToken = data.ctoolhuAuthToken;
	if (!authToken) {
		alert('No auth token set');
		return;
	}

	// Make sure we're in a course, also grab the course ID
	const regex = document.URL.match(/\/courses\/(\d+)/);

	// Verify that this is a valid site to post to
	if (!validateSite(data.validSiteList)) {
		return;
	}

	if (regex)
	{
		const courseID = regex[1];

		// Grab copied data
		chrome.storage.local.get(['copiedData'], data => {
			const copiedData = data.copiedData;

			if (!confirm(`Are you sure you want to paste this ${copiedData.item_type}?`)) {
				return;
			}

			if (copiedData) {
				let itemType = copiedData.item_type;
				switch (itemType) {
					case 'assignment':
						pasteAssignment(copiedData, courseID, authToken);
						break;
					
					case 'discussion':
						pasteDiscussion(copiedData, courseID, authToken);
						break;
					
					case 'page':
						pastePage(copiedData, courseID, authToken);
						break;

					case 'quiz':
						pasteQuiz(copiedData, courseID, authToken);
						break;
					
					case 'rubric':
						pasteRubric(copiedData, courseID, authToken);
						break;

					default:
						alert('Copied item is corrupted, please re-copy');
				}
			} else {
				alert('No item copied');
			}
		});
	} else {
		alert('This tool only works inside of a course');
	}
});

function validateSite(validSiteList) {
	if (validSiteList) {
		// Check if valid domain
		if (validSiteList.includes(document.domain)) {
			return true;
		} else {
			const response = prompt(`This site is not on your list of sites you can paste to. To add this to your list of sites, enter the domain below. The domain for this site is ${document.domain}`).trim();
			if (response && response === document.domain) {
				validSiteList.push(document.domain);

				// Add to list of valid sites, and validate pasting
				chrome.storage.local.set({'validSiteList': validSiteList}, () => {});

				return true;
			} else if (!response) { // The left the response empty
				return false;
			} else { //The response is not equal to the domain
				return validateSite(validSiteList);
			}
		}
	} else {
		validSiteList = [];
		return validateSite(validSiteList);
	}
}

async function pasteAssignment(copiedData, courseID, authToken) {
	// Consolidate payload
	let payload = '';

	const params = ['peer_reviews', 'automatic_peer_reviews', 'grade_group_students_individually', 'points_possible', 'grading_type', 'due_at', 'lock_at', 'unlock_at', 'only_visible_to_overrides', 'published', 'omit_from_final_grade', 'grader_comments_visible_to_graders', 'graders_anonymous_to_graders', 'graders_names_visible_to_graders', 'anonymous_grading', 'name', 'description'];

	// Store all parameters
	for (param of params) {
		if (copiedData[param]){
			// If the value is a string, encode it just in case
			const val = (typeof copiedData[param] === 'string') ? encodeURIComponent(copiedData[param]) : copiedData[param];

			payload += `assignment[${param}]=${val}&`;
		}
	}

	if (copiedData.submission_types) {
		for (type of copiedData.submission_types) {
			payload += `assignment[submission_types][]=${type}&`;
		}
	}
	
	if (copiedData.allowed_extensions) {
		for (extension of copiedData.allowed_extensions) {
			payload += `assignments[allowed_extensions][]=${extension}&`;
		}
	}

	// Get rid of extra '&'
	payload = payload.substr(0, payload.length - 1);

	let assignment;

	try {
		assignment = await apiCall(`${document.location.origin}/api/v1/courses/${courseID}/assignments`, 'POST', payload, authToken);
	} catch(err) {
		// Could be an issue with the payload size - decrease and re-post
		payload = payload.replace(/assignment\[description\]=[^&]+/, 'assignment[description]=Description too long to paste');
		console.log(payload);
		assignment = await apiCall(`${document.location.origin}/api/v1/courses/${courseID}/assignments`, 'POST', payload, authToken);
	}

	// We will continue pasting should we have a rubric associated with this assignment
	if (!(copiedData.rubric && copiedData.rubric_settings)) {
		alert('Done!');
		return;
	}

	// Create rubric
	// If you don't include rubric_id=new in the payload, this will just be absolutely broken. I spent like 12 hours on this because it's not mentioned anywhere in our docs
	const rubricSettings = copiedData.rubric_settings;

	payload = `rubric[title]=${rubricSettings.title}&rubric[points_possible]=${rubricSettings.points_possible}&rubric_association[use_for_grading]=${copiedData.use_rubric_for_grading}&rubric_association[hide_score_total]=${rubricSettings.hide_score_total}&rubric_association[hide_points]=${rubricSettings.hide_points}&rubric[free_form_criterion_comments]=${rubricSettings.free_form_criterion_comments}&rubric_id=new&rubric_association[association_type]=Assignment&rubric_association[association_id]=${assignment.id}`
	// may need to add back in payload = '&rubric_association[purpose]=grading';

	let currentCriterion = 0;
	for (criterion of copiedData.rubric) {
		for (entry of Object.entries(criterion)) {
			// Look at the key of each entry of this criterion
			switch (entry[0]) {
				case 'id':
					break;

				case 'ratings':
					const ratings = entry[1];
					let currentRating = 0;
					for (rating of ratings) {
						for (ratingEntry of Object.entries(rating)) {
							if (ratingEntry[1] && ratingEntry[0] != 'id') {
								payload += `&rubric[criteria][${currentCriterion}][ratings][${currentRating}][${ratingEntry[0]}]=${ratingEntry[1]}`;
							}
						}

						currentRating++;
					}
					break;

				default:
					if (entry[1]) {
						payload += `&rubric[criteria][${currentCriterion}][${entry[0]}]=${entry[1]}`;
					}
			}
		}

		currentCriterion++;
	}

	apiCall(`${document.location.origin}/api/v1/courses/${courseID}/rubrics`, 'POST', payload, authToken);

	alert("Done!");
}

async function pasteDiscussion(copiedData, courseID, authToken) {
	let payload = '';

	const params = ['discussion_type', 'published', 'delayed_post_at', 'allow_rating', 'lock_at', 'podcast_enabled', 'podcast_has_student_posts', 'require_initial_post', 'pinned', 'only_graders_can_rate', 'sort_by_rating', 'title', 'message', 'comments_disabled'];

	// Store all parameters
	for (param of params) {
		if (copiedData[param]){
			// If the value is a string, encode it just in case
			const val = (typeof copiedData[param] === 'string') ? encodeURIComponent(copiedData[param]) : copiedData[param];

			payload += `${param}=${val}&`;
		}
	}

	if (copiedData.subscription_hold) {
		payload += 'is_announcement=true&';
	}

	// Add assignment object
	if (copiedData.assignment) {
		const params = ['peer_reviews', 'automatic_peer_reviews', 'grade_group_students_individually', 'points_possible', 'grading_type', 'due_at', 'lock_at', 'unlock_at', 'only_visible_to_overrides', 'published', 'omit_from_final_grade', 'moderated_grading', 'grader_comments_visible_to_graders', 'graders_anonymous_to_graders', 'graders_names_visible_to_graders', 'anonymous_grading'];

		for (param of params) {
			if (copiedData.assignment[param])
				payload += `assignment[${param}]=${copiedData.assignment[param]}$`;
		}
	}

	// Remove extra '&'
	payload = payload.substr(0, payload.length - 1);
	let discussion;

	try {
		discussion = await apiCall(`${document.location.origin}/api/v1/courses/${courseID}/discussion_topics`, 'POST', payload, authToken);
	} catch(err) {

		// Could be an issue with the payload size - decrease and re-post
		payload = payload.replace(/message=[^&]+/, 'message=Description too long to paste');
		discussion = await apiCall(`${document.location.origin}/api/v1/courses/${courseID}/discussion_topics`, 'POST', payload, authToken);
	}

	// Add rubric
	if (copiedData.assignment && copiedData.assignment.rubric) {
		const assignment = copiedData.assignment;
		const rubricSettings = assignment.rubric_settings;

		// Create rubric
		// If you don't include rubric_id=new in the payload, this will just be absolutely broken. I spent like 12 hours on this because it's not mentioned anywhere in our docs
		payload = `rubric[title]=${rubricSettings.title}&rubric[points_possible]=${rubricSettings.points_possible}&rubric_association[use_for_grading]=${assignment.use_rubric_for_grading}&rubric_association[hide_score_total]=${rubricSettings.hide_score_total}&rubric_association[hide_points]=${rubricSettings.hide_points}&rubric[free_form_criterion_comments]=${rubricSettings.free_form_criterion_comments}&rubric_id=new&rubric_association[association_type]=Assignment&rubric_association[association_id]=${discussion.assignment_id}`
		// may need to add back in payload = '&rubric_association[purpose]=grading';

		let currentCriterion = 0;
		for (criterion of assignment.rubric) {
			for (entry of Object.entries(criterion)) {
				// Look at the key of each entry of this criterion
				switch (entry[0]) {
					case 'id':
						break;

					case 'ratings':
						const ratings = entry[1];
						let currentRating = 0;
						for (rating of ratings) {
							for (ratingEntry of Object.entries(rating)) {
								if (ratingEntry[1] && ratingEntry[0] != 'id') {
									payload += `&rubric[criteria][${currentCriterion}][ratings][${currentRating}][${ratingEntry[0]}]=${ratingEntry[1]}`;
								}
							}

							currentRating++;
						}
						break;

					default:
						if (entry[1]) {
							payload += `&rubric[criteria][${currentCriterion}][${entry[0]}]=${entry[1]}`;
						}
				}
			}

			currentCriterion++;
		}

		apiCall(`${document.location.origin}/api/v1/courses/${courseID}/rubrics`, 'POST', payload, authToken);
	}

	for (reply of copiedData.entries) {
		const entry = ensureResults(`${document.location.origin}/api/v1/courses/${courseID}/discussion_topics/${discussion.id}/entries`, 'POST', `message=${encodeURIComponent(reply.message)}`, 'message', authToken);

		// Add recent replies to entries
		if (reply.recent_replies) {
			addEntryReplies(entry, reply.recent_replies, `${document.location.origin}/api/v1/courses/${courseID}/discussion_topics/${discussion.id}/entries`, authToken);
		}
	}

	alert('Done!');
}

async function pastePage(copiedData, courseID, authToken) {
	// Consolidate payload
	let payload = '';

	for (entry of Object.entries(copiedData)) {
		switch (entry[0]) {
			case 'item_type':
				break;
			
			default:
				// For some reason the payloads for pages don't like to be encoded (wtf?)
				if (entry[1]) {
					payload += `wiki_page[${entry[0]}]=${entry[1]}&`;
				}
		}
	}

	// Get rid of extra '&'
	payload = payload.substr(0, payload.length - 1);

	try {
		await apiCall(`${document.location.origin}/api/v1/courses/${courseID}/pages`, 'POST', payload, authToken);
	} catch (err) {
		payload = payload.replace(/wiki_page\[body\]=[^&]+/, 'wiki_page[body]=Description too long to paste');
		await apiCall(`${document.location.origin}/api/v1/courses/${courseID}/pages`, 'POST', payload, authToken);
	}

	alert('Done!');
}

async function pasteQuiz(copiedData, courseID, authToken) {
	// Consolidate payload
	let payload = '';

	const params = ['quiz_type', 'assignment_group_id', 'time_limit', 'shuffle_answers', 'hide_results', 'show_correct_answers', 'show_correct_answers_last_attempt', 'show_correct_answers_at', 'hide_correct_answers_at', 'allowed_attempts', 'scoring_policy', 'one_question_at_a_time', 'cant_go_back', 'access_code', 'ip_filter', 'due_at', 'lock_at', 'unlock_at', 'published', 'one_time_results', 'only_visible_to_overrides', 'title', 'description'];

	for (param of params) {
		if (copiedData[param]) {
			// If the value is a string, encode it just in case
			const val = (typeof copiedData[param] === 'string') ? encodeURIComponent(copiedData[param]) : copiedData[param];

			payload += `quiz[${param}]=${val}&`;
		}
	}

	// Get rid of extra '&'
	payload = payload.substr(0, payload.length - 1);

	let quiz;
	
	try {
		quiz = await apiCall(`${document.location.origin}/api/v1/courses/${courseID}/quizzes`, 'POST', payload, authToken);
	} catch (err) {
		payload = payload.replace(/quiz\[description\]=[^&]+/, 'quiz[description]=Description too long to paste');
		quiz = await apiCall(`${document.location.origin}/api/v1/courses/${courseID}/quizzes`, 'POST', payload, authToken);
	}

	// Map question groups in original quiz to groups in new quiz
	let groupIDMap = {};
	let postedGroupCount = 0;

	for (questionGroup of copiedData.question_groups) {

		payload = `quiz_groups[][name]=${questionGroup.name}&quiz_groups[][pick_count]=${questionGroup.pick_count}&quiz_groups[][question_points]=${questionGroup.question_points}`;

		// If we don't declare this outside of the callback, all questiongroupids will be the same
		const questionGroupID = questionGroup.id;

		ensureResults(`${document.location.origin}/api/v1/courses/${courseID}/quizzes/${quiz.id}/groups`, 'POST', payload, null, authToken).then(data => {
			// https://canvas.instructure.com/doc/api/quiz_question_groups.html#method.quizzes/quiz_groups.create
			groupIDMap[questionGroupID] = data.quiz_groups[0].id;
			postedGroupCount++;
		});
	}

	// Wait until all groups are grabbed
	while (postedGroupCount < copiedData.question_groups.length) {
		await sleep(25);
	}

	// Add questions/answers to quiz
	const questionParams = ['question_type', 'position', 'points_possible', 'formula_decimal_places', 'question_name', 'question_text', 'correct_comments_html', 'incorrect_comments_html', 'neutral_comments_html', 'text_after_answers', 'answer_tolerance', 'matching_answer_incorrect_matches'];
	const ansParams = { html: 'html', blank_id: 'blank_id', name: 'name', comments_html: 'comments_html', numerical_answer_type: 'numerical_answer_type', match_id: 'match_id', text: 'text', answer_weight: 'weight', answer_text: 'answer', answer_exact: 'exact', answer_error_margin: 'margin', answer_range_start: 'start', answer_range_end: 'end', answer_approximate: 'approximate', answer_precision: 'precision', answer_match_left: 'left', answer_match_right: 'right', answer_comment_html: 'comments_html'};

	for (question of copiedData.questions) {
		// Empty payload
		payload = '';

		for (param of questionParams) {
			if (question[param]) {
				const val = (typeof question[param] === 'string') ? encodeURIComponent(question[param]) : question[param];

				payload += `question[${param}]=${val}&`;
			}
		}

		// For whatever reason, the quiz questions api has a lot of uniquely defined parameters, which is really dumb and stupid and I hate it
		let variableCount = 0;
		if (question.variables) {
			for (variable of question.variables) {
				payload += `question[variables][${variableCount}][name]=${encodeURIComponent(variable.name)}&question[variables][${variableCount}][min]=${variable.min}&question[variables][${variableCount}][max]=${variable.max}&question[variables][${variableCount}][scale]=${variable.scale}&`;
			}
			variableCount++;
		}

		if (question.formulas) {
			for (formula of question.formulas) {
				payload += `question[formulas][]=${encodeURIComponent(formula.formula)}&`;
			}
		}

		let matchingCount = 0;
		if (question.matches) {
			for (matching of question.matches) {
				payload += `question[matches][${matchingCount}][text]=${encodeURIComponent(matching.text)}&question[matches][${matchingCount}][match_id]=${matching.match_id}&`
			}
			matchingCount++;
		}

		// Put question in group if it was associated with one
		if (question.quiz_group_id && groupIDMap[question.quiz_group_id]) {
			payload += `question[quiz_group_id]=${groupIDMap[question.quiz_group_id]}&`;
		}

		// Add the answers to the question
		let answerCount = 0;
		for (answer of question.answers) {

			// There are many parameters that are special for the quiz question answers api
			for (entry of Object.entries(ansParams)) {
				if (answer[entry[1]]) {
					let val = (typeof answer[entry[1]] === 'string') ? encodeURIComponent(answer[entry[1]]) : answer[entry[1]];

					payload += `question[answers][${answerCount}][${entry[0]}]=${val}&`;
				}
			}

			// Check for the speical variables param
			let variableAnsCount = 0;
			if (answer.variables) {
				for (variable of answer.variables) {
					payload += `question[answers][${answerCount}][variables][${variableAnsCount}][name]=${variable.name}&question[answers][${answerCount}][variables][${variableAnsCount}][value]=${variable.value}&`;
				}
			}

			answerCount++;
		}

		// Get rid of excess '&'
		payload = payload.substr(0, payload.length - 1);

		ensureResults(`${document.location.origin}/api/v1/courses/${courseID}/quizzes/${quiz.id}/questions`, 'POST', payload, null, authToken);
	}

	alert('Done');
}

async function pasteRubric(copiedData, courseID, authToken) {
	// Consolidate payload
	let payload = '';

	payload += `rubric_association[purpose]=bookmark&rubric_association[association_type]=Course&rubric_association[association_id]=${courseID}&rubric[title]=${encodeURIComponent(copiedData.title)}&rubric[free_form_criterion_comments]=${copiedData.free_form_criterion_comments}`;

	console.log(copiedData);

	let currentCriterion = 0;
	for (criterion of copiedData.data) {
		console.log('thing');
		for (entry of Object.entries(criterion)) {
			// Look at the key of each entry of this criterion
			switch (entry[0]) {
				case 'id':
					break;

				case 'ratings':
					const ratings = entry[1];
					let currentRating = 0;
					for (rating of ratings) {
						for (ratingEntry of Object.entries(rating)) {
							if (ratingEntry[1] && ratingEntry[0] != 'id') {
								payload += `&rubric[criteria][${currentCriterion}][ratings][${currentRating}][${ratingEntry[0]}]=${ratingEntry[1]}`;
							}
						}

						currentRating++;
					}
					break;

				default:
					if (entry[1]) {
						payload += `&rubric[criteria][${currentCriterion}][${entry[0]}]=${entry[1]}`;
					}
			}
		}

		currentCriterion++;
	}

	console.log(payload);
	
	await apiCall(`${document.location.origin}/api/v1/courses/${courseID}/rubrics`, 'POST', payload, authToken);

	alert("Done!");
}

async function addEntryReplies(promisedEntry, replies, URL, authToken) {
	const entry = await promisedEntry;

	if (entry) {
		for (reply of replies) {
			ensureResults(`${URL}/${entry.id}/replies`, 'POST', `message=${encodeURIComponent(reply.message)}`, 'message', authToken);
		}
	}
}