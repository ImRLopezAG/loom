FROM postgres:18
# Private native oracle: only core, two compiler jobs, no companion extensions.
RUN apt-get update && apt-get install -y --no-install-recommends build-essential postgresql-server-dev-18 libgeos-dev libproj-dev libxml2-dev libjson-c-dev libprotobuf-c-dev protobuf-c-compiler ca-certificates && rm -rf /var/lib/apt/lists/*
COPY postgis-3.6.4.tar.gz /tmp/
RUN echo 'ed8dc6679f1e06f7b113592b04cde2a7e00f1b1e681294c8ca2204058990cec6  /tmp/postgis-3.6.4.tar.gz' | sha256sum -c - && tar -xzf /tmp/postgis-3.6.4.tar.gz -C /tmp && cd /tmp/postgis-3.6.4 && ./configure --without-raster --without-topology --without-sfcgal --without-address-standardizer && make -j2 SUBDIRS="liblwgeom libpgcommon deps postgis" && make -j2 -C extensions/postgis sql/postgis--3.6.4.sql postgis.control && make -C postgis install && install -m644 extensions/postgis/postgis.control extensions/postgis/sql/postgis--3.6.4.sql "$(pg_config --sharedir)/extension/"
