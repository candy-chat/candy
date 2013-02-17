#!/bin/bash

# this is all super hyper custom for me and my machine, buttt
# gotta have a nice way to do it.

scp -i ~/Documents/multitude/infrastructure/ec2/multitude.pem index.html ubuntu@jabber.multitudecorp.com:/usr/share/nginx/www/.

scp -r -i ~/Documents/multitude/infrastructure/ec2/multitude.pem ../res ubuntu@jabber.multitudecorp.com:/usr/share/nginx/www/.

scp -r -i ~/Documents/multitude/infrastructure/ec2/multitude.pem ../src ubuntu@jabber.multitudecorp.com:/usr/share/nginx/www/.

scp -r -i ~/Documents/multitude/infrastructure/ec2/multitude.pem ../libs ubuntu@jabber.multitudecorp.com:/usr/share/nginx/www/.

scp -r -i ~/Documents/multitude/infrastructure/ec2/multitude.pem ../*.js ubuntu@jabber.multitudecorp.com:/usr/share/nginx/www/.
