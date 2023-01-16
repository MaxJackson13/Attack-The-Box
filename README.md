# Attack-The-Box

I've played plenty of HackTheBox and it's a great way to get to know your way around different operating systems and to learn about and interact with new technologies you might not have had the chance to otherwise. I was always amazed by level of complexity and detail that goes into some of the machines so I felt the learning experience in making a vulnerable machine starting from a relatively barebones base image must be a level up entirely from playing them. So here's my first stab at one. :)

# Machine Summary

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
