// Copyright (c) 2017, Dataent and contributors
// For license information, please see license.txt

dataent.ui.form.on('Bench Settings', {
	onload: function(frm) {
		if (frm.doc.__islocal != 1) frm.save();
		let site_config_fields = ["background_workers", "shallow_clone", "admin_password",
			"auto_email_id", "auto_update", "dataent_user", "global_help_setup",
			"dropbox_access_key", "dropbox_secret_key", "gunicorn_workers", "github_username",
			"github_password", "mail_login", "mail_password", "mail_port", "mail_server",
			"use_tls", "rebase_on_pull", "redis_cache", "redis_queue", "redis_socketio",
			"restart_supervisor_on_update", "root_password", "serve_default_site",
			"socketio_port", "update_bench_on_update", "webserver_port", "developer_mode",
			"file_watcher_port"];
		site_config_fields.forEach(function(val){
			frm.toggle_display(val, frm.doc[val] != undefined);
		});
	},
	refresh: function(frm) {
		frm.add_custom_button(__("Get App"), function(){
			var dialog = new dataent.ui.Dialog({
				title: 'App Name',
				fields: [
					{fieldname: 'app_name', fieldtype: 'Data', reqd:true, label: 'Name of the dataent repo hosted on github'}
				]
			});
			dialog.set_primary_action(__("Get App"), () => {
				let key = dataent.datetime.get_datetime_as_string();
				console_dialog(key);
				frm.call("console_command", {
					key: key,
					caller: 'get-app',
					app_name: dialog.fields_dict.app_name.value
				}, () => {
					dialog.hide();
				});
			});
			dialog.show();
		});
		frm.add_custom_button(__('New Site'), function(){
			dataent.call({
				method: 'bench_manager.bench_manager.doctype.site.site.pass_exists',
				args: {
					doctype: frm.doctype
				},
				btn: this,
				callback: function(r){
					var dialog = new dataent.ui.Dialog({
						fields: [
							{fieldname: 'site_name', fieldtype: 'Data', label: "Site Name", reqd: true},
							{fieldname: 'install_epaas', fieldtype: 'Check', label: "Install epaas"},
							{fieldname: 'admin_password', fieldtype: 'Password',
								label: 'Administrator Password', reqd: r['message']['condition'][0] != 'T',
								default: (r['message']['admin_password'] ? r['message']['admin_password'] :'admin'),
								depends_on: `eval:${String(r['message']['condition'][0] != 'T')}`},
							{fieldname: 'mysql_password', fieldtype: 'Password',
								label: 'MySQL Password', reqd: r['message']['condition'][1] != 'T',
								default: r['message']['root_password'], depends_on: `eval:${String(r['message']['condition'][1] != 'T')}`}
						],
					});
					dialog.set_primary_action(__("Create"), () => {
						let key = dataent.datetime.get_datetime_as_string();
						let install_epaas;
						if (dialog.fields_dict.install_epaas.last_value != 1){
							install_epaas = "false";
						} else {
							install_epaas = "true";
						}
						dataent.call({
							method: 'bench_manager.bench_manager.doctype.site.site.verify_password',
							args: {
								site_name: dialog.fields_dict.site_name.value,
								mysql_password: dialog.fields_dict.mysql_password.value
							},
							callback: function(r){
								if (r.message == "console"){
									console_dialog(key);
									dataent.call({
										method: 'bench_manager.bench_manager.doctype.site.site.create_site',
										args: {
											site_name: dialog.fields_dict.site_name.value,
											admin_password: dialog.fields_dict.admin_password.value,
											mysql_password: dialog.fields_dict.mysql_password.value,
											install_epaas: install_epaas,
											key: key
										}
									});
									dialog.hide();
								} 
							}
						});
					});
					dialog.show();
				}
			});
		});
		frm.add_custom_button(__("Update"), function(){
			let key = dataent.datetime.get_datetime_as_string();
			console_dialog(key);
			frm.call("console_command", {
				key: key,
				caller: "bench_update"
			});
		});
		frm.add_custom_button(__('Sync'), () => {
			dataent.call({
				method: 'bench_manager.bench_manager.doctype.bench_settings.bench_settings.sync_all'
			});
		});
	}
});