document.getElementById('ctoolhuImage').addEventListener('click', function() {
	var display = document.getElementById('debugging').style.display;

	if (display === 'block')
		document.getElementById('debugging').style.display = 'none';
	else
		document.getElementById('debugging').style.display = 'block';
});