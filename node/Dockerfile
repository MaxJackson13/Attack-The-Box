FROM node:latest

COPY ./supervisord.conf /etc/supervisor/conf.d/

WORKDIR /app

COPY . .

RUN apt update && apt install -y --force-yes \
        openssh-server \
        supervisor 

RUN mkdir /var/run/sshd

RUN chmod 0755 /var/run/sshd

RUN useradd -m -s /bin/bash -u 1001 admin2

RUN echo 'admin2:changeme2' | chpasswd

RUN npm install

EXPOSE 5000

ENTRYPOINT ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/supervisord.conf"]
