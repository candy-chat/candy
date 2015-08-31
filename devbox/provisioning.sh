#!/usr/bin/env bash
#
# Vagrant provisioning script
#
# Legal: See the LICENSE file at the top-level directory of this distribution
# and at https://github.com/candy-chat/candy/blob/master/LICENSE
#

#
# Install Prosody XMPP server
#
echo "deb http://packages.prosody.im/debian precise main" > /etc/apt/sources.list.d/prosody.list
wget https://prosody.im/files/prosody-debian-packages.key -O- | sudo apt-key add -
apt-get update

apt-get install -y liblua5.1-bitop prosody lua-event

# Install Websockets module
wget -O /usr/lib/prosody/modules/mod_websocket.lua http://prosody-modules.googlecode.com/hg/mod_websocket/mod_websocket.lua

# Install Carbons module
wget -O /usr/lib/prosody/modules/mod_websocket.lua http://prosody-modules.googlecode.com/hg/mod_carbons/mod_carbons.lua

# Place config
cp /vagrant/devbox/prosody.cfg.lua /etc/prosody/prosody.cfg.lua

/etc/init.d/prosody restart

#
# Install nginx for static file serving
#
apt-get install -y nginx
cp /vagrant/devbox/nginx-default.conf /etc/nginx/sites-available/default
sed --in-place 's|{{ROOT_DIR}}|/vagrant|g' /etc/nginx/sites-available/default/nginx-default.conf
/etc/init.d/nginx restart

# Set it up to cd to /vagrant on login.
profile='/home/vagrant/.profile';
if [ "$(tail -n 1 $profile)" != 'cd /vagrant' ]; then
    echo 'cd /vagrant' >> $profile;
fi

cd /vagrant;

docker-compose run grunt npm install
docker-compose run grunt bower install
