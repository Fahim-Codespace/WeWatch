FROM m1k1o/neko:firefox

# Hugging Face Spaces runs as a non-root user, so we ensure the neko user has access
USER root
RUN chmod -R 777 /home/neko

# Hugging Face usually provides port 7860
EXPOSE 7860

ENV NEKO_BIND=":7860"
ENV NEKO_UDP_PORT_MIN=52000
ENV NEKO_UDP_PORT_MAX=52100
