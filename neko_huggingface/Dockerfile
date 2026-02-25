FROM m1k1o/neko:firefox

# --- FIREFOX CLOUD FIXES ---
# Disable Firefox Sandbox for cloud environments (fixes EACCES/502 crashes)
ENV MOZ_DISABLE_CONTENT_SANDBOX=1
ENV MOZ_NODEJS_SANDBOX=0
ENV MOZ_DISABLE_GMP_SANDBOX=1

# --- NEKO V3 CONFIGURATION ---
ENV NEKO_WEBRTC_TCPMUX=1
ENV NEKO_SERVER_PROXY=1
ENV NEKO_WEBRTC_IP_RETRIEVAL_URL=https://checkip.amazonaws.com
ENV NEKO_CAPTURE_VIDEO_CODEC=vp8

# Hybrid STUN/TURN for better Punch-through
ENV NEKO_WEBRTC_ICESERVERS_FRONTEND='[{"urls":["stun:stun.l.google.com:19302"]},{"urls":["stun:openrelay.metered.ca:80"]},{"urls":["turn:openrelay.metered.ca:80"],"username":"openrelay","credential":"openrelay"},{"urls":["turn:openrelay.metered.ca:443"],"username":"openrelay","credential":"openrelay"}]'

# Authentication (BOTH Legacy and V3 for safety)
ENV NEKO_PASSWORD=watch123
ENV NEKO_PASSWORD_ADMIN=admin123
ENV NEKO_MEMBER_PROVIDER=multiuser
ENV NEKO_MEMBER_MULTIUSER_USER_PASSWORD=watch123
ENV NEKO_MEMBER_MULTIUSER_ADMIN_PASSWORD=admin123

# Expose Railway's default-ish port
EXPOSE 8080

# Railway provides the PORT environment variable.
# We use a shell to ensure $PORT is evaluated correctly at runtime.
# Using 0.0.0.0 is critical for Railway ingress.
CMD ["sh", "-c", "NEKO_SERVER_BIND=0.0.0.0:$PORT /usr/bin/supervisord -c /etc/neko/supervisord.conf"]
