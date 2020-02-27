var locationInfo = document.location.pathname;
var shardID;
var globRootID;
var masquerading;
var currentUser;
var garbageRemoval = ' AND action!=ping AND controller!=page_views AND action!=unread_count';

getPageInfo('https://' + document.domain);

function splunk(regionInfo)
{
	var query = 'search index=canvas_' + regionInfo.index + ' global_root_account=' + globRootID + ' | search http_request=' + locationInfo + getMasqueradingQuery() + garbageRemoval;
	targetURL = 'https://inst' + regionInfo.splunkBit + '.splunkcloud.com/en-US/app/canvas/search?q=' + encodeURIComponent(query);
	var win = window.open(targetURL, '_blank');
}

function getMasqueradingQuery()
{
	return (masquerading == true) ? ' AND user_id=*' + currentUser : '';
}

function getPageInfo(url)
{
	var request = new XMLHttpRequest;
	request.open("GET",url,!1);
	request.send(null);

	var xmlDoc = request.responseText;

	masquerading = /users\/\d+\/masquerade/g.test(xmlDoc);

	currentUser = xmlDoc.match(/"current_user_id":"([^"]+)/)[1];

	var header = request.getResponseHeader("x-canvas-meta");

	var region = header.match(/z=(\w+-\w+-\d)/)[1];

	var s = header.match(/s=(\d+)/)[1];
	var a = header.match(/a=(\d+)/)[1];
	globRootID = s + "~" + a;

	splunk(getRegionInfo(region));
}

function getRegionInfo(input)
{
	var output = [];
	switch(input)
	{
		case 'us-east-1':
			output.index = 'iad';
			output.splunkBit = '';
			break;
		case 'us-west-2':
			output.index = 'pdx';
			output.splunkBit = '';
			break;
		case 'ap-southeast-1':
			output.index = 'sin';
			output.splunkBit = 'syd';
			break;
		case 'ap-southeast-2':
			output.index = 'syd';
			output.splunkBit = 'syd';
			break;
		case 'eu-west-1':
			output.index = 'dub';
			output.splunkBit = 'dub';
			break;
		case 'eu-central-1':
			output.index = 'fra';
			output.splunkBit = 'dub';
			break;
		case 'ca-central-1':
			output.index = 'yul';
			output.splunkBit = 'yul';
			break;
		default:
			output.index = false;
	}
	
	return output;
}