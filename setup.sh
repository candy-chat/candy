#!/usr/bin/env bash
#
# Easy installation for contributing to candy
#
# Copyright 2014 Michael Weibel <michael.weibel@gmail.com>
# Copyright 2015 Adhearsion Foundation Inc <info@adhearsion.com>
# License: MIT
#

# Show errors in case of undefined variables
set -o nounset

echo
echo "Welcome to the Candy Vagrant setup"
echo
echo "This script will setup a Vagrant box with development dependencies on it."
echo "It will also build Candy and run tests to verify that everything is working."
echo
echo "In case of an error, use 'install.log' for log informations."
echo

touch install.log
echo "" > install.log

echo -n "* Booting Vagrant box (this might take a while)..."
if vagrant up --no-provision >> install.log 2>&1
  then echo "done"
else
  echo "failed!"
  echo "Do you have 'vagrant' installed in your PATH?"
  echo "Please check install.log"
  echo
  echo "Aborting"
  exit 2
fi

echo -n "* Provisioning Vagrant box (this might take a few minutes)..."
if vagrant provision >> install.log 2>&1
  then echo "done"
else
  echo "failed!"
  echo "Please check install.log"
  echo
  echo "Aborting"
  exit 2
fi

echo -n "* Building Candy and running tests..."
vagrant ssh -c "cd /vagrant && grunt && grunt test"

echo
echo "Candy is now running on http://localhost:8080"
echo

exit 0
