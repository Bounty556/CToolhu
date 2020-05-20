const locationInfo = document.location.pathname;
let shardID;
let globRootID;
let masquerading;
let currentUser;
const garbageRemoval = 'AND action!=ping AND controller!=page_views AND action!=unread_count';

getPageInfo(`https://${document.domain}`);

function splunk(regionInfo)
{
	const query = `search index=canvas_${regionInfo.index} global_root_account=${globRootID} http_request=${locationInfo} ${getMasqueradingQuery()} ${garbageRemoval}`;
	const targetURL = `https://inst${regionInfo.splunkBit}.splunkcloud.com/en-US/app/canvas/search?q=${encodeURIComponent(query)}`;
	window.open(targetURL, '_blank');
}

function getMasqueradingQuery()
{
	return (masquerading) ? `AND user_id=*${currentUser}` : '';
}

function getPageInfo(url)
{
	let request = new XMLHttpRequest;
	request.open('GET', url, !1);
	request.send(null);

	const xmlDoc = request.responseText;

	masquerading = /users\/\d+\/masquerade/g.test(xmlDoc);

	currentUser = xmlDoc.match(/"current_user_id":"([^"]+)/)[1];

	const header = request.getResponseHeader("x-canvas-meta");

	const region = header.match(/z=(\w+-\w+-\d)/)[1];

	const s = header.match(/s=(\d+)/)[1];
	const a = header.match(/a=(\d+)/)[1];
	globRootID = `${s}~${a}`;

	splunk(getRegionInfo(region));
}

function getRegionInfo(input)
{
	let output = [];
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