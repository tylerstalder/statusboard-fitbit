statusboard-fitbit
==================

Serves Panic Statusboard friendly charts of Fitbit data.

Setup
------------
* npm install
* cp defaults.env .env
* add Fitbit api keys and auth callback url to .env
* foreman start

Paths
------------
* /auth -- do the fitbit oauth dance
* /fitbit -- 7 day history of steps
* /sleep -- 7 day history of sleep

Deps
------------
* mongod
* foreman
* node
