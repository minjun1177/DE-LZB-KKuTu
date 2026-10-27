# Pinned patch level: 24.22.1 is the first 24.x release fixing CVE-2026-111497
# (Brotli decoder out-of-bounds write leading to RCE in node:zlib), plus the
# other October 2026 fixes (CVE-2026-105482/105483/106069/106072/105481/106074).
FROM node:24.22.1-bookworm-slim

WORKDIR /app/Server

# Dependency layer (cacheable). heapdump is optional and skipped:
# its nan-based build fails on modern Node, and Game/master.js tolerates its absence.
COPY Server/lib/package.json Server/lib/package-lock.json ./lib/
RUN cd lib && npm ci --omit=optional --no-audit --no-fund

# Source + client bundle build (views load grunt-generated js not in git)
COPY Server/lib ./lib
RUN cd lib && npx grunt default pack

# The app runs as 'node' but /app is root-owned; pre-create the error log
# (Game/master.js, Game/slave.js append to /app/KKUTU_ERROR.log) so it is writable.
RUN touch /app/KKUTU_ERROR.log && chown node:node /app/KKUTU_ERROR.log

USER node
EXPOSE 80 8080 8496
CMD ["node", "lib/Game/cluster.js", "0", "1"]
