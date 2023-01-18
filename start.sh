#!/bin/bash

if [ "$EUID" -ne 0 ]
  then echo "Please run this script with sudo"
  exit
fi

iptables -A OUTPUT -s 172.18.0.1 -d 172.18.0.3 -j DROP

docker-compose up -d
