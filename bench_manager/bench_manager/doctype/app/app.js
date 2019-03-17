// Copyright (c) 2017, Dataent and contributors
// For license information, please see license.txt

dataent.ui.form.on('App', {
	onload: function(frm) {
		if (frm.doc.__islocal != 1) frm.save();
		dataent.realtime.on("Bench-Manager:reload-page", () => frm.reload_doc());
	},
	refresh: function(frm) {
		if (frm.doc.version == undefined) $('div.form-inner-toolbar').hide();
		else $('div.form-inner-toolbar').show();
		let app_fields = ["app_title", "version", "app_description", "app_publisher", "app_email",
			"app_icon", "app_color", "app_license"];
		app_fields.forEach(function(app_field) {
			frm.set_df_property(app_field, "read_only", frm.doc.__islocal ? 0 : 1);
		});
		if (frm.doc.is_git_repo != true) {
			frm.add_custom_button(__("Git Init"), function(){
				let key = dataent.datetime.get_datetime_as_string();
				console_dialog(key);
				frm.doc.is_git_repo = true;
				frm.call("console_command", {
					key: key,
					caller: "git_init"
				}, () => {
					setTimeout(() => { frm.save(); }, 5000);
				});
			});
		} else {
			frm.add_custom_button(__('Commit'), function(){
				var dialog = new dataent.ui.Dialog({
					title: 'Commit Message',
					fields: [
						{fieldname: 'commit_msg', fieldtype: 'Small Text', 'reqd':1, 'label':'Type in the commit message'}
					],
				});
				dialog.set_primary_action(__("Commit"), () => {
					let key = dataent.datetime.get_datetime_as_string();
					console_dialog(key);
					frm.call("console_command", {
						key: key,
						commit_msg: dialog.fields_dict.commit_msg.value,
						caller: "commit"
					}, () => {
						dialog.hide();
					});
				});
				dialog.show();
			});
			frm.add_custom_button(__('Stash'), function(){
				let key = dataent.datetime.get_datetime_as_string();
				console_dialog(key);
				frm.call("console_command", {
					key: key,
					caller: "stash"
				});
			});
			frm.add_custom_button(__('Apply Stash'), function(){
				let key = dataent.datetime.get_datetime_as_string();
				console_dialog(key);
				frm.call("console_command", {
					key: key,
					caller: "apply-stash"
				});
			});
			frm.add_custom_button(__('Pull & Rebase'), function(){
				dataent.call({
					method: 'bench_manager.bench_manager.doctype.app.app.get_remotes',
					args: {
						docname: frm.doc.name,
					},
					btn: this,
					callback: function(r) {
						var dialog = new dataent.ui.Dialog({
							title: 'Select Remote',
							fields: [
								{fieldname: 'remote_name', fieldtype: 'Select', 'options': r.message, 'reqd':1, 'label':'Select remote to pull and rebase from'}
							],
						});
						dialog.set_primary_action(__("Pull & Rebase"), () => {
							let key = dataent.datetime.get_datetime_as_string();
							console_dialog(key);
							frm.call("pull_rebase", {
								key: key,
								remote: dialog.fields_dict.remote_name.value
							}, () => {
								dialog.hide();
							});
						});
						dialog.show();
					}
				});
			});
			frm.add_custom_button(__('Track Remote'), function(){
				dataent.call({
					method: 'bench_manager.bench_manager.doctype.app.app.get_remotes',
					args: {
						docname: frm.doc.name,
					},
					btn: this,
					callback: function(r) {
						var dialog = new dataent.ui.Dialog({
							title: 'Select Remote',
							fields: [
								{fieldname: 'branch_name', fieldtype: 'Data', 'reqd':1, 'label':'New branch name'},
								{fieldname: 'remote_name', fieldtype: 'Select', 'options': r.message, 'reqd':1, 'label':'Select remote to track'}
							],
						});
						dialog.set_primary_action(__("Track"), () => {
							let key = dataent.datetime.get_datetime_as_string();
							console_dialog(key);
							frm.call("console_command", {
								key: key,
								branch_name: dialog.fields_dict.branch_name.value,
								remote: dialog.fields_dict.remote_name.value,
								caller: "track-remote"
							}, () => {
								dialog.hide();
							});
						});
						dialog.show();
					}
				});
			});
			frm.add_custom_button(__('Switch Branch'), function(){
				dataent.call({
					method: 'bench_manager.bench_manager.doctype.app.app.get_branches',
					args: {
						doctype: frm.doctype,
						docname: frm.doc.name,
						current_branch: frm.doc.current_git_branch
					},
					btn: this,
					callback: function(r) {
						if(!r.message) dataent.msgprint('This app has just one branch');
						else {
							var dialog = new dataent.ui.Dialog({
								title: 'Select Branch',
								fields: [
									{'fieldname': 'switchable_branches', 'fieldtype': 'Select', 'options': r.message, 'reqd':1, 'label':'Switchable branches'}
								],
							});
							dialog.set_primary_action(__("Switch"), () => {
								let key = dataent.datetime.get_datetime_as_string();
								console_dialog(key);
								frm.call("console_command", {
									key: key,
									branch_name: dialog.fields_dict.switchable_branches.value,
									caller: "switch_branch"
								}, () => {
									dialog.hide();
								});
							});
							dialog.show();
						}
					}
				});
			});
			frm.add_custom_button(__('New Branch'), function(){
				var dialog = new dataent.ui.Dialog({
					title: 'Create New Branch',
					fields: [
						{'fieldname': 'new_branch_name', 'fieldtype': 'Data'}
					],
				});
				dialog.set_primary_action(__("Create"), () => {
					let key = dataent.datetime.get_datetime_as_string();
					console_dialog(key);
					frm.call("console_command", {
						key: key,
						branch_name: dialog.fields_dict.new_branch_name.value,
						caller: "new_branch"
					}, () => {
						dialog.hide();
					});
				});
				dialog.show();
			});
			frm.add_custom_button(__('Delete Branch'), function(){
				dataent.call({
					method: 'bench_manager.bench_manager.doctype.app.app.get_branches',
					args: {
						doctype: frm.doctype,
						docname: frm.doc.name,
						current_branch: frm.doc.current_git_branch
					},
					btn: this,
					callback: function(r) {
						if(!r.message) dataent.msgprint('This app has just one branch');
						else {						
							var dialog = new dataent.ui.Dialog({
								title: 'Select Branch',
								fields: [
									{'fieldname': 'delete_branch_name', 'fieldtype': 'Select', options: r.message, label: 'Branch Name'}
								],
							});
							dialog.set_primary_action(__("Delete"), () => {
								let key = dataent.datetime.get_datetime_as_string();
								console_dialog(key);
								frm.call("console_command", {
									key: key,
									branch_name: dialog.fields_dict.delete_branch_name.value,
									caller: "delete_branch"
								}, () => {
									dialog.hide();
								});
							});
							dialog.show();
						}
					}
				});
			});
			frm.add_custom_button(__('Fetch'), function(){
				let key = dataent.datetime.get_datetime_as_string();
				console_dialog(key);
				frm.call("console_command", {
					key: key,
					caller: "git_fetch"
				});
			});
		}
	}
});
