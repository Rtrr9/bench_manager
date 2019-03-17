# -*- coding: utf-8 -*-
# Copyright (c) 2017, Dataent and contributors
# For license information, please see license.txt


import dataent
from dataent.model.document import Document
from subprocess import Popen, PIPE, STDOUT
import re, shlex

def run_command(commands, doctype, key, cwd='..', docname=' ', after_command=None):
	verify_whitelisted_call()
	start_time = dataent.utils.time.time()
	console_dump = ""
	logged_command = " && ".join(commands)
	logged_command += " " #to make sure passwords at the end of the commands are also hidden
	sensitive_data = ["--mariadb-root-password", "--admin-password", "--root-password"]
	for password in sensitive_data:
		logged_command = re.sub("{password} .*? ".format(password=password), '', logged_command, flags=re.DOTALL)
	doc = dataent.get_doc({'doctype': 'Bench Manager Command', 'key': key, 'source': doctype+': '+docname,
		'command': logged_command, 'console': console_dump, 'status': 'Ongoing'})
	doc.insert()
	dataent.db.commit()
	dataent.publish_realtime(key, "Executing Command:\n{logged_command}\n\n".format(logged_command=logged_command), user=dataent.session.user)
	try:
		for command in commands:
			terminal = Popen(shlex.split(command), stdin=PIPE, stdout=PIPE, stderr=STDOUT, cwd=cwd)
			for c in iter(lambda: safe_decode(terminal.stdout.read(1)), ''):
				dataent.publish_realtime(key, c, user=dataent.session.user)
				console_dump += c
		if terminal.wait():
			_close_the_doc(start_time, key, console_dump, status='Failed', user=dataent.session.user)
		else:
			_close_the_doc(start_time, key, console_dump, status='Success', user=dataent.session.user)
	except Exception as e:
		_close_the_doc(start_time, key, "{} \n\n{}".format(e, console_dump), status='Failed', user=dataent.session.user)
	finally:
		dataent.db.commit()
		# hack: dataent.db.commit() to make sure the log created is robust,
		# and the _refresh throws an error if the doc is deleted 
		dataent.enqueue('bench_manager.bench_manager.utils._refresh',
			doctype=doctype, docname=docname, commands=commands)

def _close_the_doc(start_time, key, console_dump, status, user):
	time_taken = dataent.utils.time.time() - start_time
	final_console_dump = ''
	console_dump = console_dump.split('\n\r')
	for i in console_dump:
		i = i.split('\r')
		final_console_dump += '\n'+i[-1]
	dataent.set_value('Bench Manager Command', key, 'console', final_console_dump)
	dataent.set_value('Bench Manager Command', key, 'status', status)
	dataent.set_value('Bench Manager Command', key, 'time_taken', time_taken)
	dataent.publish_realtime(key, '\n\n'+status+'!\nThe operation took '+str(time_taken)+' seconds', user=user)

def _refresh(doctype, docname, commands):
	dataent.get_doc(doctype, docname).run_method('after_command', commands=commands)

@dataent.whitelist()
def verify_whitelisted_call():
	if 'bench_manager' not in dataent.get_installed_apps():
		raise ValueError("This site does not have bench manager installed.")

def safe_decode(string, encoding = 'utf-8'):
	try:
		string = string.decode(encoding)
	except Exception:
		pass
	return string

