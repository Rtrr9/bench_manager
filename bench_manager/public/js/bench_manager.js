// Copyright (c) 2017, Dataent and contributors
// For license information, please see license.txt

var console_dialog = (key) => {
	var dialog = new dataent.ui.Dialog({
		title: 'Console',
		fields: [
			{fieldname: 'console', fieldtype: 'HTML'},
		]
	});
	dataent._output_target = $('<pre class="console"><code></code></pre>')
		.appendTo(dialog.get_field('console').wrapper)
		.find('code')
		.get(0);
	dataent._output = '';
	dataent._in_progress = false;
	dataent._output_target.innerHTML = '';
	dialog.show();
	dialog.$wrapper.find('.modal-dialog').css('width', '800px');

	dataent.realtime.on(key, function(output) {
		if (output==='\r') {
			// clear current line, means we are showing some kind of progress indicator
			dataent._in_progress = true;
			if(dataent._output_target.innerHTML != dataent._output) {
				// progress updated... redraw
				dataent._output_target.innerHTML = dataent._output;
			}
			dataent._output = dataent._output.split('\n').slice(0, -1).join('\n') + '\n';
			return;
		} else {
			dataent._output += output;
		}

		if (output==='\n') {
			dataent._in_progress = false;
		}

		if (dataent._in_progress) {
			return;
		}

		if (!dataent._last_update) {
			dataent._last_update = setTimeout(() => {
				dataent._last_update = null;
				if(!dataent.in_progress) {
					dataent._output_target.innerHTML = dataent._output;
				}
			}, 200);
		}
	});
};