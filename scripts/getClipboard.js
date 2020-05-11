chrome.storage.local.get(['copiedData'], function(data) {
	if (data) {
		formatCopiedData(data.copiedData);
	}
});

function formatCopiedData(copiedData) {
	let formatted = createEntry(copiedData, 0, '');

	chrome.storage.local.set({'ctoolhuClipboard': formatted}, () => {});
}

function createEntry(object, tabs, string) {
	string += `${'  '.repeat(tabs)}{<br />`;
	
	tabs++;

	let entries = Object.entries(object);
	for (entry of entries) {
		string += `${'  '.repeat(tabs)}${entry[0]}: `;

		switch (typeof entry[1]) {
			case 'object':
				if (entry[1]) {
					string += '<br />';
					string = createEntry(entry[1], tabs, string);
				} else {
					string += `${entry[1]}<br />`;
				}
				break;
			
			case 'string':
				// Replace < and > with their escaped versions
				let temp = entry[1].replace(/</g,'&#60;');
				temp = temp.replace(/>/g,'&#62;');
				string += `"${temp}"<br />`;
				break;

			default:
				string += `${entry[1]}<br />`;
				break;
		}
	}

	tabs--;

	string += `${'  '.repeat(tabs)}}<br />`;

	return string;
}