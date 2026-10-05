# Exact private pgRouting oracle on the verified PostGIS core artifact.
FROM loom-postgis-core-3.6.4-pg18:local
RUN apt-get update && apt-get install -y --no-install-recommends cmake libboost-graph-dev && rm -rf /var/lib/apt/lists/*
COPY pgrouting-3.8.0.tar.gz /tmp/
RUN echo 'b8a5f0472934fdf7cda3fb4754d01945378d920cdaddc01f378617ddbb9c447f  /tmp/pgrouting-3.8.0.tar.gz' | sha256sum -c - && tar -xzf /tmp/pgrouting-3.8.0.tar.gz -C /tmp && cmake -S /tmp/pgrouting-3.8.0 -B /tmp/pgrouting-build -DCMAKE_BUILD_TYPE=Release -DBUILD_TESTING=OFF -DWITH_DOC=OFF && cmake --build /tmp/pgrouting-build --parallel 2 && cmake --install /tmp/pgrouting-build
