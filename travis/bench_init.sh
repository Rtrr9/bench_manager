#!/bin/bash

cd ~/
curl -I https://github.com/dataent/dataent/tree/$TRAVIS_BRANCH | head -n 1 | cut -d $' ' -f2 | (
	read response;
	[ $response == '200' ] && branch=$TRAVIS_BRANCH || branch='develop';
	bench init dataent-bench --dataent-path https://github.com/dataent/dataent.git --dataent-branch $branch
)
