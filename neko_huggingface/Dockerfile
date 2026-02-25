FROM m1k1o/neko:firefox

# ============================================
# NEKO V2 CONFIGURATION FOR RAILWAY
# The image m1k1o/neko:firefox is V2, so we
# MUST use V2 environment variable names!
# ============================================

# --- FIREFOX CLOUD FIXES ---
ENV MOZ_DISABLE_CONTENT_SANDBOX=1
ENV MOZ_NODEJS_SANDBOX=0
ENV MOZ_DISABLE_GMP_SANDBOX=1

# --- AUTHENTICATION (V2 style) ---
ENV NEKO_PASSWORD=watch123
ENV NEKO_PASSWORD_ADMIN=admin123

# --- WEBRTC NETWORKING (V2 style) ---
# ICE Lite: reduces port requirements
ENV NEKO_ICELITE=true

# TCP Mux: multiplex ALL WebRTC over a SINGLE TCP port
# Railway only exposes one port, so we mux on 8081 internally
# and rely on TURN relay for the actual media transport.
ENV NEKO_TCPMUX=8081

# ICE servers: STUN for discovery + TURN for relay (critical for Railway)
ENV NEKO_ICESERVERS='[{"urls":["stun:stun.l.google.com:19302"]},{"urls":["turn:openrelay.metered.ca:80"],"username":"openrelay","credential":"openrelay"},{"urls":["turn:openrelay.metered.ca:443"],"username":"openrelay","credential":"openrelay"},{"urls":["turn:openrelay.metered.ca:443?transport=tcp"],"username":"openrelay","credential":"openrelay"}]'

# Video codec
ENV NEKO_VIDEO_CODEC=vp8

# Railway provides the PORT env var dynamically.
# We bind the HTTP/WS server to that port.
CMD ["sh", "-c", "NEKO_BIND=0.0.0.0:$PORT /usr/bin/supervisord -c /etc/neko/supervisord.conf"]
