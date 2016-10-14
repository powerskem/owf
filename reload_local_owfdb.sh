#!/bin/sh
psql -W -h localhost -U postgres -c 'drop database owfdb;'
psql -W -h localhost -U postgres -f PostgreSQLPrefsInitialCreate.sql
psql -W -h localhost -U postgres -f update_owfdb.sql

