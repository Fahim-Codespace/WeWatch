FROM m1k1o/neko:firefox

# Hugging Face Spaces runs as a non-root user, so we ensure the neko user has access
USER root
RUN chmod -R 777 /home/neko

# Hugging Face usually provides port 7860
EXPOSE 7860

# Railway provides the PORT environment variable automatically
# We bind to :8080 as a fallback but Neko will use $PORT if we don't override it.
# Actually, it's safer to tell Neko exactly where to listen.
ENV NEKO_SERVER_BIND=0.0.0.0:$PORT

# CRITICAL: Disable Firefox Sandbox for cloud environments (fixes EACCES crash)
ENV MOZ_DISABLE_CONTENT_SANDBOX=1

# --- NEKO V3 CONFIGURATION ---
ENV NEKO_WEBRTC_TCPMUX=1
ENV NEKO_SERVER_PROXY=1
ENV NEKO_WEBRTC_IP_RETRIEVAL_URL=https://checkip.amazonaws.com
ENV NEKO_CAPTURE_VIDEO_CODEC=vp8
ENV NEKO_WEBRTC_ICESERVERS_FRONTEND='[{"urls":["stun:openrelay.metered.ca:80"]},{"urls":["turn:openrelay.metered.ca:80"],"username":"openrelay","credential":"openrelay"},{"urls":["turn:openrelay.metered.ca:443"],"username":"openrelay","credential":"openrelay"},{"urls":["turn:openrelay.metered.ca:443?transport=tcp"],"username":"openrelay","credential":"openrelay"}]'

# Authentication
ENV NEKO_MEMBER_PROVIDER=multiuser
ENV NEKO_MEMBER_MULTIUSER_USER_PASSWORD=watch123
ENV NEKO_MEMBER_MULTIUSER_ADMIN_PASSWORD=admin123
