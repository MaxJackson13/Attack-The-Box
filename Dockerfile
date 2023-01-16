FROM splunk/splunk:7.0.0

ENV SPLUNK_START_ARGS=--accept-license

COPY ./server.conf /opt/splunk/etc/system/local/server.conf

COPY ./supervisord.conf /etc/supervisor/conf.d/

COPY --chown=root:root ./entrypoint.sh /sbin/entrypoint.sh

COPY --chown=root:root ./health_check.pl /root/health_check.pl

RUN chmod +x /sbin/entrypoint.sh /root/health_check.pl

RUN apt update && apt install -y --force-yes \
	openssh-server \
	supervisor \
	cron \
	tcpdump 

RUN cpanm LWP::UserAgent IO::Socket::SSL

RUN mkdir /var/run/sshd

RUN chmod 0755 /var/run/sshd

RUN useradd -m -s /bin/bash -u 1000 admin2

RUN echo 'admin2:changeme2' | chpasswd

RUN echo 'root:changeme3' | chpasswd

#RUN echo 'Authorization: Basic cm9vdDpjaGFuZ2VtZTM=' > /root/headers.txt

RUN echo '* * * * * perl /root/health_check.pl' > /var/spool/cron/crontabs/root

RUN usermod -aG sudo admin2

RUN sed -i 's/%sudo/#%sudo/g' /etc/sudoers

RUN echo 'admin2 ALL=(root) NOEXEC: /usr/sbin/tcpdump -ni lo * ' >> /etc/sudoers

ENTRYPOINT ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/supervisord.conf"]
