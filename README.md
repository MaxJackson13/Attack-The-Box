# Attack-The-Box

I've played plenty of HackTheBox and it's a great way to get to know your way around different operating systems and to learn about and interact with new technologies you might not have had the chance to otherwise. I was always amazed by level of complexity and detail that goes into some of the machines so I felt the learning experience in making a vulnerable machine must be a level up entirely from playing them. I decided to make a network of a couple docker containers where a user can go from external access to root

# Machine Summary

Running `start.sh` launches `docker-compose` to create a node app at `172.18.0.2` and a splunk instance at `172.18.0.3`. The script sets the iptables rule `iptables -A OUTPUT -s 172.18.0.1 -d 172.18.0.3 -j DROP` which has the effect of simulating a publically exposed web app with the splunk instance in a private network.

The web app is the SSRF app from my `Vulnerable-Web-App` repo. We can leverage the SSRF to make requests to the splunk instance even though the app backend filters out private addresses from the `webhookURL` input. If we stand up a php server and a script redirecting to the splunk container, we can reach the endpoint `172.18.0.3:8089/services/authentication/users` and have this page sent to a netcat listener at the specified `payloadURL`. From this we can see an `admin2` user.

Knowing weak credentials `admin:user` were in use, we can try an authenticate with these over `ssh` to the web app container but this user isn't on the box. From here we could try and bruteforce the `admin2` user, creating a wordlist from the password `changeme` using hashcat. The credentials `admin2:changeme2` work.

There's not much on the web app container, so we could try and pivot to the splunk container hoping for password reuse. We find we can `ssh` to the splunk container with the same credentials.

Being a splunk admin in the container, `admin2` has sudo privileges to list and read files in `/opt/splunk`. We can use this to read configuration files which reveal an encrypted RSA private key used to encrypt traffic to the splunk management service on port 8089, as well as the `sslPassword` used to encrypt the RSA key. We can use `openssl` to decrypt the key. `admin2` also has sudo privileges to run `tcpdump` on the loopback interface- presumably for troubleshooting purposes. 

We can upload `pspy64` to find a root owned cron running each minute, called `health_check.pl`. This script sounds like it could be generating traffic so we can use tcpdump to capture packets and save it to a `pcap`. We can exfil the `pcap` to our attacking box along with the RSA private key and use `tshark` to decrypt the traffic if the key exchange isn't Diffie-Hellman based. Decrypting the traffic reveals requests to `127.0.0.1:8089/services` using basic authentication, so the username and password appear base64 encoded in the `Authorization` header. Now we have essentially cleartext root credentials on the box so we can `su -` to root!

# Speedrun

<img src="images/health_check.png">
<img src="images/re.png">
<img src="images/res.png">
<img src="images/user.png">

<img src="images/access1.png">
<img src="images/access2.png">
<img src="images/sudo.png">
<img src="images/sslpass.png">
