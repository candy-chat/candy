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

#
# Candy development dependencies
#
sudo add-apt-repository ppa:chris-lea/node.js
sudo apt-get update
sudo apt-get install -y nodejs git
npm install -g grunt-cli
npm install -g bower

cd /vagrant
su -u vagrant npm install
su -u vagrant bower install

#
# Selenium & PhantomJS for testing
#
cd
apt-get install -y openjdk-7-jre
mkdir /usr/lib/selenium/
wget --no-verbose --output-document=/usr/lib/selenium/selenium-server-standalone-2.42.2.jar -- http://selenium-release.storage.googleapis.com/2.42/selenium-server-standalone-2.42.2.jar
mkdir -p /var/log/selenium/
chmod a+w /var/log/selenium/
cp /vagrant/devbox/selenium.init.sh /etc/init.d/selenium
chmod 755 /etc/init.d/selenium
/etc/init.d/selenium start
update-rc.d selenium defaults
apt-get install -y build-essential g++ flex bison gperf ruby perl libsqlite3-dev libfontconfig1-dev libicu-dev libfreetype6 libssl-dev libpng-dev libjpeg-dev python libx11-dev libxext-dev
git clone git://github.com/ariya/phantomjs.git
cd phantomjs
git checkout 2.0
./build.sh --confirm
sudo cp bin/* /usr/local/bin
