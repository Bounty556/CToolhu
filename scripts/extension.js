$('#ctoolhuImage').on('click', toggleDevConsole);
$('#masquerade').on('click', toggleMasqueradePanel);
$('input[name="role"]').on('click', toggleMasqueradeButtons);
$('#miscTools').on('click', toggleMiscPanel);
$('#clearSites').on('click', clearValidSites);
$('#clearClipboard').on('click', clearClipboard);
$(document.body).on('click', '.deleteSite', deleteSite);

function toggleDevConsole() {
	updateClipboard();
	updateValidSites();
	toggleSection('debugging');
}

function toggleMasqueradePanel() {
	chrome.tabs.query({active: true, currentWindow: true}, updateMasqueradingData);
	toggleSection('masquerading');
}

function toggleMiscPanel() {
	toggleSection('miscellaneous');
}

function clearValidSites() {
	chrome.storage.local.set({'validSiteList': []}, () => {
		updateValidSites();
	});
}

function clearClipboard() {
	chrome.storage.local.set({'copiedData': {}}, () => {
		updateClipboard();
	});
}

function deleteSite() {
	chrome.storage.local.get(['validSiteList'], data => {
		let siteList = data.validSiteList;
		const index = siteList.findIndex(site => site === $(this).attr('data_site'));

		console.log(index);

		siteList.splice(index, 1);

		chrome.storage.local.set({'validSiteList': siteList}, () => {
			updateValidSites();
		});
	});
}

async function updateClipboard() {
	chrome.storage.local.get(['copiedData'], data => {
		const copiedData = data.copiedData;

		if (!copiedData.item_type) {
			$('#clipboardSummary').html('');
			return;
		}

		let clipboardString = '';

		// Get type of object
		clipboardString += `Type: ${capitalize(copiedData.item_type)}\n`;

		// Get name of object
		clipboardString += `Name: ${getObjectName(copiedData)}\n`;

		// Get origin of object
		clipboardString += `URL: <a href="${copiedData.html_url || '#'}" target="_blank">Link</a>\n`;

		// Get misc info of object
		clipboardString += getMiscData(copiedData);

		$('#clipboardSummary').html(clipboardString);
	});
}

async function updateValidSites() {
	chrome.storage.local.get(['validSiteList'], data => {
		const siteList = data.validSiteList;
		let siteListString = '';

		for (site of siteList) {
			siteListString += `${site} <img class='deleteSite' data_site="${site}" src="./res/delete.png" width=8/>\n`;
		}

		$('#validSites').html(siteListString);
	});
}

function toggleMasqueradeButtons() {
	if ($(this).val() != 'admin') {
		$('#includedAdminRoles').hide();
	} else {
		$('#includedAdminRoles').show();
	}
}

function updateMasqueradingData(tabs) {
	const domain = tabs[0].url.match(/(https?:\/\/[^/]+)\//)[1];

	chrome.storage.local.get(['ctoolhuAuthToken'], function(data) {
		const authToken = data.ctoolhuAuthToken;
		if (!authToken) {
			return;
		}
		$.ajax({
			url: domain,
			method: 'GET',
			beforeSend: xhr => {
				xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
			}
		}).then((data, textStatus, jqXHR) => {
			// This will be null if we are not masquerading
			const realUser = jqXHR.getResponseHeader('x-canvas-real-user-id');

			// If we're actually masquerading
			if (realUser) {
				// Get the id of the user we're acting as
				const currentUser = jqXHR.getResponseHeader('x-canvas-user-id');

				// If we don't pass in our actual user id, the call will be made with the permissions of the user we're acting as instead
				$.ajax({
					url: `${domain}/api/v1/users/${currentUser}?as_user_id=${realUser}`,
					method: 'GET',
					beforeSend: function(xhr) {
						xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
					}
				}).then(data => {
					// Update user info in popup window
					$('#masqueradeName').text(data.name);
					$('#masqueradeID').text(data.id);
					$('#masqueradeSIS').text(data.sis_user_id || '');
					$('#masqueradeUserPage').attr('href', `${domain}/users/${currentUser}`);
					$('#masqueradeImage').attr('src', data.avatar_url);

					$('#currentlyMasquerading').show();
				});
			}
		});
   });
}

function toggleSection(section) {
	const sections = ['debugging', 'masquerading', 'miscellaneous'];
	const leaveOff = $(`#${section}`).css('display') === 'block';	

	for (id of sections) {
		$(`#${id}`).css('display', 'none');
	}

	if (!leaveOff) {
		$(`#${section}`).css('display', 'block');
	}
}

function getObjectName(object) {
	const type = object.item_type;

	switch (type) {
		case 'quiz':
			return object.title;
		case 'assignment':
			return object.name;
		case 'discussion':
			return object.title;
		case 'rubric':
			return object.title;
		case 'page':
			return object.title;
		default:
			return '';
	}
}

function getMiscData(object) {
	const type = object.item_type;
	let string = '';

	switch (type) {
		case 'quiz':
			let type = object.quiz_type;
			if (type === 'assignment') {
				type = 'Graded Quiz';
			}
			string += `Quiz Type: ${type || 'Graded Quiz'}\n`;
			string += `Question Count: ${object.questions.length}\n`;
			break;
		case 'discussion':
			string += `Entry Count: ${object.entries.length}\n`;
			break;
		case 'assignment':
		case 'rubric':
		case 'page':
			break;
	}

	return string;
}