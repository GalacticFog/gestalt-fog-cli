FROM alpine

LABEL vendor="Galactic Fog IP, Inc."
LABEL com.galacticfog.version="release-${VERSION}"

# inject fog cli
COPY ./target/alpine/fog /usr/local/bin/fog
RUN chmod 755 /usr/local/bin/fog
