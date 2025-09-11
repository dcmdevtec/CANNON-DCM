-- ========================================
-- Tablas principales para facturación, tracking y buques
-- ========================================

-- Tabla para contenedores consultados
CREATE TABLE cnn_container_info (
    id SERIAL PRIMARY KEY,
    container_id VARCHAR(20) NOT NULL,
    container_type VARCHAR(50),
    container_status VARCHAR(100),
    shipping_line_name VARCHAR(100),
    shipping_line_id VARCHAR(20),
    tare VARCHAR(20),
    shipped_from VARCHAR(100),
    shipped_from_terminal VARCHAR(100),
    shipped_to VARCHAR(100),
    shipped_to_terminal VARCHAR(100),
    atd_origin TIMESTAMP,
    eta_final_destination TIMESTAMP,
    last_location VARCHAR(100),
    last_location_terminal VARCHAR(100),
    next_location VARCHAR(100),
    next_location_terminal VARCHAR(100),
    atd_last_location TIMESTAMP,
    eta_next_destination TIMESTAMP,
    timestamp_of_last_location TIMESTAMP,
    last_movement_timestamp TIMESTAMP,
    loading_port VARCHAR(100),
    discharging_port VARCHAR(100),
    customs_clearance VARCHAR(100),
    bill_of_lading VARCHAR(100),
    last_vessel_name VARCHAR(100),
    last_voyage_number VARCHAR(50),
    current_vessel_name VARCHAR(100),
    current_voyage_number VARCHAR(50),
    last_updated TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para facturación y tracking de contenedores
CREATE TABLE cnn_factura_tracking (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(50),
    proveedor VARCHAR(100),
    contrato VARCHAR(50),
    despacho VARCHAR(50),
    num_contenedor VARCHAR(20),
    llegada_bquilla DATE,
    contenedor VARCHAR(20),
    estado VARCHAR(100),
    naviera VARCHAR(50),
    factura VARCHAR(50),
    etd DATE,
    eta DATE,
    dias_transito INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    container_info_id INT,
    FOREIGN KEY (container_info_id) REFERENCES cnn_container_info(id)
);

CREATE TABLE cnn_vessel_position (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(64),
    name VARCHAR(128),
    name_ais VARCHAR(128),
    mmsi VARCHAR(16),
    imo VARCHAR(16),
    eni VARCHAR(32),
    country_iso VARCHAR(8),
    country_name VARCHAR(64),
    callsign VARCHAR(16),
    type VARCHAR(64),
    type_specific VARCHAR(64),
    gross_tonnage INTEGER,
    deadweight INTEGER,
    teu VARCHAR(16),
    liquid_gas VARCHAR(16),
    length DOUBLE PRECISION,
    breadth DOUBLE PRECISION,
    draught_avg DOUBLE PRECISION,
    draught_max DOUBLE PRECISION,
    speed_avg DOUBLE PRECISION,
    speed_max DOUBLE PRECISION,
    year_built VARCHAR(8),
    is_navaid BOOLEAN,
    home_port VARCHAR(64),
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    course DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    navigation_status VARCHAR(64),
    destination VARCHAR(64),
    last_position_epoch BIGINT,
    last_position_UTC TIMESTAMP,
    eta_epoch BIGINT,
    eta_UTC TIMESTAMP
);

-- Tabla para incidencias detectadas en buques
CREATE TABLE cnn_vessel_incident (
    id SERIAL PRIMARY KEY,
    vessel_name VARCHAR(100) NOT NULL,
    navigation_status VARCHAR(100),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description VARCHAR(255)
);

DROP VIEW IF EXISTS v_tracking_contenedor_completo;

CREATE VIEW v_tracking_contenedor_completo AS
SELECT
    ft.id AS factura_id,
    ci.id AS container_id_ref,
    ft.titulo,
    ft.proveedor,
    ft.contrato,
    ft.despacho,
    ft.num_contenedor,
    COALESCE(TO_CHAR(ci.eta_final_destination, 'YYYY-MM-DD'), TO_CHAR(ft.llegada_bquilla, 'YYYY-MM-DD')) AS llegada_a_barranquilla,
    TO_CHAR(ft.llegada_bquilla, 'YYYY-MM-DD') AS llegada_bquilla,
    ft.contenedor,
    ft.estado,
    ft.naviera,
    ft.factura,
    TO_CHAR(ci.atd_origin, 'YYYY-MM-DD') AS etd,
    TO_CHAR(ci.eta_final_destination, 'YYYY-MM-DD') AS eta,
    ft.dias_transito,
    ft.created_at AS factura_created_at,
    ft.container_info_id,
    ci.container_id,
    ci.container_type,
    ci.container_status,
    ci.shipping_line_name,
    ci.shipping_line_id,
    ci.tare,
    ci.shipped_from,
    ci.shipped_from_terminal,
    ci.shipped_to,
    ci.shipped_to_terminal,
    -- columnas duplicadas eliminadas
    ci.last_location,
    ci.last_location_terminal,
    ci.next_location,
    ci.next_location_terminal,
    ci.atd_last_location,
    ci.eta_next_destination,
    ci.timestamp_of_last_location,
    ci.last_movement_timestamp,
    ci.loading_port,
    ci.discharging_port,
    ci.customs_clearance,
    ci.bill_of_lading,
    ci.last_vessel_name,
    ci.last_voyage_number,
    ci.current_vessel_name,
    ci.current_voyage_number,
    ci.last_updated AS container_last_updated,
    ci.created_at AS container_created_at,
    vp.id AS vessel_id,
    vp.imo,
    vp.mmsi,
    vp.lat,
    vp.lon,
    vp.navigation_status,
    vp.last_position_utc,
    vp.eta_utc,
    vp.last_position_UTC AS vessel_last_updated,
    CASE WHEN vp.id IS NOT NULL THEN TRUE ELSE FALSE END AS vessel_exists
FROM cnn_factura_tracking ft
INNER JOIN cnn_container_info ci
    ON ft.num_contenedor = ci.container_id
LEFT JOIN cnn_vessel_position vp
    ON vp.name = COALESCE(ci.last_vessel_name, ci.current_vessel_name);
