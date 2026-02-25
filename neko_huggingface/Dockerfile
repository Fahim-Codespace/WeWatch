FROM m1k1o/neko:firefox

# Hugging Face Spaces runs as a non-root user, so we ensure the neko user has access
USER root
RUN chmod -R 777 /home/neko

# Hugging Face usually provides port 7860
EXPOSE 7860

# Railway provides the PORT environment variable automatically
ENV NEKO_SERVER_BIND=":7860"

# --- NEKO V3 CONFIGURATION ---
# Enable TCP Mux (WebRTC over TCP)
ENV NEKO_WEBRTC_TCPMUX=1
# Server is behind a proxy (Railway Ingress)
ENV NEKO_SERVER_PROXY=1
# Public IP retrieval for WebRTC
ENV NEKO_WEBRTC_IP_RETRIEVAL_URL=https://checkip.amazonaws.com
# Video Codec
ENV NEKO_CAPTURE_VIDEO_CODEC=vp8
# TURN/STUN Servers (Frontend)
ENV NEKO_WEBRTC_ICESERVERS_FRONTEND='[{"urls":["stun:openrelay.metered.ca:80"]},{"urls":["turn:openrelay.metered.ca:80"],"username":"openrelay","credential":"openrelay"},{"urls":["turn:openrelay.metered.ca:443"],"username":"openrelay","credential":"openrelay"},{"urls":["turn:openrelay.metered.ca:443?transport=tcp"],"username":"openrelay","credential":"openrelay"}]'

# Authentication (V3 Style)
ENV NEKO_MEMBER_PROVIDER=multiuser
ENV NEKO_MEMBER_MULTIUSER_USER_PASSWORD=watch123
ENV NEKO_MEMBER_MULTIUSER_ADMIN_PASSWORD=admin123
