#!/bin/sh

# fix config file so I can remote psql to initialize the owf database
cat pg_hba.conf.addon >> /var/lib/pgsql/data/pg_hba.conf

