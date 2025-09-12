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
    uuid UUID PRIMARY KEY, -- identificador único
    name TEXT, -- nombre del buque
    mmsi TEXT, -- Maritime Mobile Service Identity
    imo TEXT, -- IMO number
    eni TEXT, -- European Number of Identification
    country_iso CHAR(2), -- código país ISO
    type TEXT, -- tipo general de buque (Cargo, Tanker, etc.)
    type_specific TEXT, -- tipo específico (ej: Container Ship)

    lat DOUBLE PRECISION, -- latitud
    lon DOUBLE PRECISION, -- longitud
    speed DOUBLE PRECISION, -- velocidad en nudos
    course DOUBLE PRECISION, -- rumbo en grados
    heading DOUBLE PRECISION, -- dirección proa
    current_draught DOUBLE PRECISION, -- calado actual en metros
    navigation_status TEXT, -- estado de navegación

    destination TEXT, -- destino (código UN/LOCODE)
    dest_port_uuid UUID, -- uuid del puerto destino
    dest_port TEXT, -- nombre del puerto destino
    dest_port_unlocode TEXT, -- UN/LOCODE destino

    dep_port_uuid UUID, -- uuid del puerto origen
    dep_port TEXT, -- nombre del puerto origen
    dep_port_unlocode TEXT, -- UN/LOCODE origen

    last_position_epoch BIGINT, -- timestamp epoch última posición
    last_position_utc TIMESTAMP WITH TIME ZONE, -- última posición en UTC

    atd_epoch BIGINT, -- Actual Time of Departure (epoch)
    atd_utc TIMESTAMP WITH TIME ZONE, -- Actual Time of Departure (UTC)

    eta_epoch BIGINT, -- Estimated Time of Arrival (epoch)
    eta_utc TIMESTAMP WITH TIME ZONE, -- Estimated Time of Arrival (UTC)

    timezone_offset_sec INT, -- offset en segundos
    timezone TEXT, -- zona horaria en formato string
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() -- tracking interno
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
    ci.atd_origin,
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
    vp.uuid AS vessel_uuid,
    vp.name,
    vp.name_ais,
    vp.mmsi,
    vp.imo,
    vp.eni,
    vp.country_iso,
    vp.country_name,
    vp.callsign,
    vp.type,
    vp.type_specific,
    vp.gross_tonnage,
    vp.deadweight,
    vp.teu,
    vp.liquid_gas,
    vp.length,
    vp.breadth,
    vp.draught_avg,
    vp.draught_max,
    vp.speed_avg,
    vp.speed_max,
    vp.year_built,
    vp.is_navaid,
    vp.home_port,
    vp.lat,
    vp.lon,
    vp.speed,
    vp.course,
    vp.heading,
    vp.current_draught,
    vp.navigation_status,
    vp.destination,
    vp.dest_port_uuid,
    vp.dest_port,
    vp.dest_port_unlocode,
    vp.dep_port_uuid,
    vp.dep_port,
    vp.dep_port_unlocode,
    vp.last_position_epoch,
    vp.last_position_utc,
    vp.atd_epoch,
    vp.atd_utc,
    vp.eta_epoch,
    vp.eta_utc,
    vp.timezone_offset_sec,
    vp.timezone,
    vp.created_at AS vessel_created_at,
    CASE WHEN vp.uuid IS NOT NULL THEN TRUE ELSE FALSE END AS vessel_exists
FROM cnn_factura_tracking ft
INNER JOIN cnn_container_info ci
    ON ft.num_contenedor = ci.container_id
LEFT JOIN cnn_vessel_position vp
    ON vp.name = COALESCE(ci.last_vessel_name, ci.current_vessel_name);
