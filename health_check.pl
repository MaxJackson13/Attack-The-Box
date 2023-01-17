use LWP::UserAgent;
use IO::Socket::SSL;

my $ua = LWP::UserAgent->new;
$ua->ssl_opts(verify_hostname => 0, SSL_cipher_list => 'AES128-SHA256', SSL_verify_mode => IO::Socket::SSL::SSL_VERIFY_NONE);
$ua->default_header('Authorization' => "Basic cm9vdDpjaGFuZ2VtZTM=");

my $response = $ua->get('https://127.0.0.1:8089/services');

if ($response->is_success) {
    print $response->decoded_content;
} else {
    die $response->status_line;
}
