FROM loom-postgis-core-3.6.4-pg18:local
# Family-owned address_standardizer 3.6.4 layer. Does not edit the PostGIS core recipe.
# Two compiler jobs. Does not install address_standardizer_data_us.
RUN apt-get update && apt-get install -y --no-install-recommends libpcre2-dev pkg-config perl \
    && rm -rf /var/lib/apt/lists/*
COPY postgis-3.6.4.tar.gz /tmp/
RUN echo 'ed8dc6679f1e06f7b113592b04cde2a7e00f1b1e681294c8ca2204058990cec6  /tmp/postgis-3.6.4.tar.gz' | sha256sum -c - \
    && tar -xzf /tmp/postgis-3.6.4.tar.gz -C /tmp \
    && cd /tmp/postgis-3.6.4 \
    && ./configure --without-raster --without-topology --without-sfcgal \
    && make -j2 -C extensions/address_standardizer \
    && make -C extensions/address_standardizer install \
    && rm -f "$(pg_config --sharedir)/extension/address_standardizer_data_us"* \
    && rm -rf /tmp/postgis-3.6.4 /tmp/postgis-3.6.4.tar.gz
