FROM m1k1o/neko:firefox

# We go back to basics to ensure permissions are correct
USER root
RUN chown -R neko:neko /home/neko
USER neko

# --- RAILWAY PORT BINDING ---
# Railway provides the PORT environment variable. 
# We use a shell to ensure $PORT is evaluated correctly at runtime.
ENV NEKO_SERVER_BIND=0.0.0.0:8080

# --- FIREFOX CLOUD FIXES ---
# Disable Firefox Sandbox for cloud environments (fixes EACCES crash)
ENV MOZ_DISABLE_CONTENT_SANDBOX=1
ENV MOZ_NODEJS_SANDBOX=0
ENV MOZ_DISABLE_GMP_SANDBOX=1

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

# Expose Railway's default-ish port
EXPOSE 8080

# Override the command to bind to Railway's dynamic PORT
CMD ["sh", "-c", "export NEKO_SERVER_BIND=0.0.0.0:$PORT && /usr/bin/supervisord -c /etc/neko/supervisord.conf"]
