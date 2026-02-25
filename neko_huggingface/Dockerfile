# We MUST run as root to allow supervisord to drop privileges to 'neko'
USER root

# Ensure the neko user has ownership of its home (critical for X-server)
RUN chown -R neko:neko /home/neko && \
    mkdir -p /tmp/.X11-unix && \
    chmod 1777 /tmp/.X11-unix && \
    chown root:root /tmp/.X11-unix

# --- FIREFOX CLOUD FIXES ---
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

# Override the command to debug user and bind to Railway's dynamic PORT
CMD ["sh", "-c", "echo 'Running as user:' $(whoami) && export NEKO_SERVER_BIND=0.0.0.0:$PORT && /usr/bin/supervisord -c /etc/neko/supervisord.conf"]
