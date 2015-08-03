# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.network :forwarded_port, guest: 80, host: 8080
  config.vm.network :forwarded_port, guest: 5280, host: 5280
  config.vm.network :forwarded_port, guest: 4444, host: 4444
  config.vm.network :private_network, ip: '192.168.88.4'

  config.vm.provision :shell, :path => "devbox/provisioning.sh"

  config.vm.synced_folder ".", "/vagrant", type: "nfs"

  config.vm.provider "virtualbox" do |v|
    v.name = "candy"
    v.customize ["modifyvm", :id, "--memory", 768]
  end
end
