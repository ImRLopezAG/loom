FROM loom-postgis-core-3.6.4-pg18:local
# Disposable tiger layer: SQL/control from exact PostGIS 3.6.4 upstream only. No census fetch.
RUN apt-get update && apt-get install -y --no-install-recommends perl make ca-certificates && rm -rf /var/lib/apt/lists/*
COPY postgis-3.6.4.tar.gz /tmp/postgis-3.6.4.tar.gz
RUN echo 'ed8dc6679f1e06f7b113592b04cde2a7e00f1b1e681294c8ca2204058990cec6  /tmp/postgis-3.6.4.tar.gz' | sha256sum -c - \
  && tar -xzf /tmp/postgis-3.6.4.tar.gz -C /tmp \
  && cd /tmp/postgis-3.6.4 \
  && ./configure --without-raster --without-topology --without-sfcgal --without-address-standardizer \
  && make -C extensions postgis_extension_helper.sql \
  && make -C extensions/postgis_tiger_geocoder sql/postgis_tiger_geocoder--3.6.4.sql postgis_tiger_geocoder.control \
  && install -m644 extensions/postgis_tiger_geocoder/postgis_tiger_geocoder.control \
    extensions/postgis_tiger_geocoder/sql/postgis_tiger_geocoder--3.6.4.sql \
    "$(pg_config --sharedir)/extension/" \
  && rm -rf /tmp/postgis-3.6.4 /tmp/postgis-3.6.4.tar.gz
