# -*- coding: utf-8 -*-
# Copyright (c) 2017, Dataent and contributors
# For license information, please see license.txt


import dataent
from dataent.model.document import Document
from dataent.model.naming import make_autoname
from subprocess import check_output, Popen, PIPE

class BenchManagerCommand(Document):
	pass