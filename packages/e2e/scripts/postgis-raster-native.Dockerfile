# Private postgis_raster 3.6.4 oracle layered on the exact core image; two compiler jobs.
# Core deliberately excludes raster; only raster/ and the raster extension SQL are built here.
FROM loom-postgis-core-3.6.4-pg18:local
RUN apt-get update && apt-get install -y --no-install-recommends libgdal-dev && rm -rf /var/lib/apt/lists/*
COPY postgis-3.6.4.tar.gz /tmp/host-postgis-3.6.4.tar.gz
RUN echo 'ed8dc6679f1e06f7b113592b04cde2a7e00f1b1e681294c8ca2204058990cec6  /tmp/postgis-3.6.4.tar.gz' | sha256sum -c - \
 && echo 'ed8dc6679f1e06f7b113592b04cde2a7e00f1b1e681294c8ca2204058990cec6  /tmp/host-postgis-3.6.4.tar.gz' | sha256sum -c - \
 && cd /tmp/postgis-3.6.4 \
 && ./configure --with-raster --without-topology --without-sfcgal --without-address-standardizer \
 && make -j2 -C raster \
 && make -j2 -C extensions/postgis_raster sql/postgis_raster--3.6.4.sql postgis_raster.control \
 && make -C raster install \
 && install -m644 extensions/postgis_raster/postgis_raster.control extensions/postgis_raster/sql/postgis_raster--3.6.4.sql "$(pg_config --sharedir)/extension/"
