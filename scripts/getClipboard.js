chrome.storage.local.get(['copiedData'], function(data) {
	if (data != null) {
		formatCopiedData(data);
	}
});

function formatCopiedData(data) {
	var formatted = '';
	var copiedData = data.copiedData;

	formatted = formatted.concat(createEntry(copiedData, 0, ''));

	chrome.storage.local.set({'ctoolhuClipboard': formatted}, function() {});
}

function createEntry(object, tabs, string) {
	string = string.concat(('  '.repeat(tabs)) + '{<br>');
	
	tabs += 1;

	var entries = Object.entries(object);
	for (var i = 0; i < entries.length; i++) {
		string = string.concat(('  '.repeat(tabs)) + entries[i][0] + ': ');

		switch (typeof entries[i][1]) {
			case 'object':
				if (entries[i][1] === null || entries[i][1]  === undefined) {
					string = string.concat(entries[i][1] + '<br>');
				} else {
					string = string.concat('<br>');
					string = createEntry(entries[i][1], tabs, string);
				}
				break;

			case 'string':
				var temp = entries[i][1].replace(/</g,'&#60;');
				temp = temp.replace(/>/g,'&#62;');
				string = string.concat('"' + temp + '"<br>');
				break;

			default:
				string = string.concat(entries[i][1] + '<br>');
				break;
		}
	}

	tabs -= 1;

	string = string.concat(('  '.repeat(tabs)) + '}<br>');

	return string;
}