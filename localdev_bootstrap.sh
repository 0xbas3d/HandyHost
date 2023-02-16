#!/bin/bash
#bootstrap encrypted keys into the app for local development on linux
#macos uses keychain for creds
ROOTHOME=/root
USERHOME=/root #if you did the install as you, make this your home
USER=root #if you did the install as you, make this your user
pidfile=$USERHOME/.HandyHost/localdev.pid
logfile=$USERHOME/.HandyHost/localdev.log
NVM_DIR=$USERHOME/.nvm
source $USERHOME/.bashrc
export NVM_DIR="$USERHOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
moveDaemonKey(){
    if [[ -s "$USERHOME/.HandyHost/keystore/daemon_$1" ]] ; then
        #client wants a launch daemon, lets move that pubkey to root area
        echo $(openssl rsautl -inkey "$ROOTHOME/.handy/handyhost.key" -decrypt -in "$USERHOME/.HandyHost/keystore/daemon_$1") | openssl rsautl -pubin -inkey $ROOTHOME/.handy/handyhost.pub -encrypt -pkcs -out "$ROOTHOME/.handy/$1"
        rm "$USERHOME/.HandyHost/keystore/daemon_$1" && \
        chown "root:root" "$ROOTHOME/.handy/$1" && \
        chmod 0600 "$ROOTHOME/.handy/$1"
    fi
}

    
moveDaemonKey "dvpn"


ENVS="HANDYHOST_BOOTSTRAPPED=true"
if [[ -s $ROOTHOME/.handy/dvpn ]] ; then
    DVPNLOC=$(uuidgen)
    echo "$(openssl rsautl -inkey $ROOTHOME/.handy/handyhost.key -decrypt -in $ROOTHOME/.handy/dvpn)" | openssl rsautl -pubin -inkey $USERHOME/.HandyHost/keystore/handyhost.pub -encrypt -pkcs -out "$USERHOME/.HandyHost/keystore/$DVPNLOC"
    chown "$USER:$USERGROUP" $USERHOME/.HandyHost/keystore/$DVPNLOC && \
    chmod 0600 $USERHOME/.HandyHost/keystore/$DVPNLOC
    
    ENVS+=" DVPNAUTO=$DVPNLOC"
fi

# trap ctrl-c and call ctrl_c()
trap ctrl_c INT

function ctrl_c() {
    echo "** killing app"
    bash -c "source $USERHOME/.bashrc && source $USERHOME/.profile && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" && cd $PWD && nvm use &&$ENVS forever stop $(cat $pidfile)"
}
ACTION="start"
if [[ ! -z $1 ]] ; then
    ACTION="$1"
fi
#set modprobe filter for dvpn on ubuntu 20
sudo modprobe ip6table_filter; \
export HOME="$USERHOME"
echo "ACTION IS $ACTION"
if [ $USER = "root" ] ; then
    bash -c "source $USERHOME/.bashrc && source $USERHOME/.profile && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" && cd $PWD && nvm use &&$ENVS forever $ACTION --pidFile $pidfile -l $logfile -a app.js"
else
    su - $USER -c "source $USERHOME/.bashrc && source $USERHOME/.profile && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" && cd $PWD && nvm use &&$ENVS forever $ACTION --pidFile $pidfile -l $logfile -a app.js"
fi
ENVS=""


echo 'to stop sentinel docker:'
echo 'sudo docker stop $(docker ps -a -q --filter ancestor=sentinel-dvpn-node --format="{{.ID}}")'
echo 'to stop handyhost app:'
echo "sudo ./localdev_bootstrap.sh stop"
echo "logs are at: $logfile"