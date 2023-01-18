# Attack-The-Box

I've played plenty of HackTheBox and it's a great way to get to know your way around different operating systems and to learn about and interact with new technologies you might not have had the chance to otherwise. I was always amazed by level of complexity and detail that goes into some of the machines so I felt the learning experience in making a vulnerable machine starting from a relatively barebones base image must be a level up entirely from playing them. So here's my first stab at one. :)

# Machine Summary

Running `start.sh` launches `docker-compose` to create a node app at `172.18.0.2` and a splunk instance at `172.18.0.3`. The script sets the iptables rule `iptables -A OUTPUT -s 172.18.0.1 -d 172.18.0.3 -j DROP` which has the effect of simulating a publically exposed web app with the splunk instance in a private network.

The web app is the SSRF app from my `Vulnerable-Web-App` repo. We can leverage the SSRF to make requests to the splunk instance even though the app backend filters out private addresses from the `webhookURL` input. If we stand up a php server and a script redirecting to the splunk container, we can reach the endpoint `/172.18.0.3:8089/services/authentication/users` and have this page sent to a netcat listener at the specified `payloadURL`. From this we can see an `admin2` user.

Knowing weak credentials `admin:user` were in use, we can try an authenticate with these over `ssh` to the web app container. This user isn't on the box. From here we could try and bruteforce the `admin2` user, creating a wordlist from the password `changeme` using hashcat. The credentials `admin2:changeme2` work.

There's not much on the web app container, so we could try and pivot to the splunk container hoping for password reuse. We find we can ssh to the splunk container with the same credentials.

Being a splunk admin in the container, the admin2 user has sudo privileges to list and read files in `/opt/splunk`. We can use this to read configuration files which reveal an encrypted RSA private key used to encrypt traffic to the splunk management service on port 8089, as well as the `sslPassword` used to encrypt the RSA key. We can use `openssl` to decrypt the key. `admin2` also has sudo privileges to run `tcpdump` on the loopback interface- presumably for troubleshooting purposes. 

We can upload `pspy64` to find a root owned cron running each minute, called `health_check.pl`. This script sounds like it could be generating traffic so we can use tcpdump to capture packets and save it to a `pcap`. We can exfil the `pcap` to our attacking box along with the RSA private key and use `tshark` to decrypt the traffic if the key exchange isn't Diffie-Hellman based. Decrypting the traffic reveals requests to `localhost:8089/services` using basic authentication. So we have roots credentials in cleartext! From here we can `su -` and we have root.

- There's a web app vulnerable to SSRF on port 5000
- There's a splunk instance installed on the machine
- SSH is open on port 22
- The web interface on port 8000 is exposed globally
- But the management API is exposed only to localhost:8089
- Research to find default credentials are 'admin:changeme'
- They haven't been changed
- Use the SSRF to read `/services/authentication/users` on the WEB API
- Note there's an `admin2` user
- Try the credentials `admin:changeme` on SSH. They don't work
- Try the credentials `admin2:changeme2` on SSH. They do work
- With sudo you can sniff packets on the loopback with tcpdump 
- There's a script `health_check.pl` running every minute as a root owned cron 
- Use tcpdump to see if the script is producing any traffic 
- Analyse the captured traffic. It's https, if it's not a DH key exchange you could crack it
- As an admin user you can read splunk config files
- Find the server's encrypted RSA private key in /opt/splunk/etc/auth/server.pem
- The encryption password is in /opt/splunk/system/default/server.conf 
- Decrypt the key with OpenSSL
- Decrypt the traffic with tshark/wireshark
- The traffic authenticates to the management API which uses basic authorization
- Base64 decode the credentials
- `su -` to root!
