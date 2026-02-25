FROM m1k1o/neko:firefox

# Hugging Face Spaces runs as a non-root user, so we ensure the neko user has access
USER root
RUN chmod -R 777 /home/neko

# Hugging Face usually provides port 7860
EXPOSE 7860

ENV NEKO_BIND=":7860"
# Enable TCP Mux to allow WebRTC over the same TCP port
ENV NEKO_TCPMUX=1
# Tell Neko it's behind a proxy
ENV NEKO_PROXY=1
# Fetch the public IP
ENV NEKO_IPFETCH=https://checkip.amazonaws.com
# Use VP8 which handles network jitter/packet loss better on TCP
ENV NEKO_VIDEO_CODEC=vp8
# Open Relay Project (TURN) credentials for fallback relaying
ENV NEKO_ICESERVERS='[{"urls":["stun:openrelay.metered.ca:80"]},{"urls":["turn:openrelay.metered.ca:80"],"username":"openrelay","credential":"openrelay"},{"urls":["turn:openrelay.metered.ca:443"],"username":"openrelay","credential":"openrelay"},{"urls":["turn:openrelay.metered.ca:443?transport=tcp"],"username":"openrelay","credential":"openrelay"}]'
