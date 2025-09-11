-- Función para insertar datos de contenedor
CREATE OR REPLACE FUNCTION cnn_insert_container_info(
    p_container_id VARCHAR,
    p_container_type VARCHAR,
    p_container_status VARCHAR,
    p_shipping_line_name VARCHAR,
    p_shipping_line_id VARCHAR,
    p_tare VARCHAR,
    p_shipped_from VARCHAR,
    p_shipped_from_terminal VARCHAR,
    p_shipped_to VARCHAR,
    p_shipped_to_terminal VARCHAR,
    p_atd_origin TIMESTAMP,
    p_eta_final_destination TIMESTAMP,
    p_last_location VARCHAR,
    p_last_location_terminal VARCHAR,
    p_next_location VARCHAR,
    p_next_location_terminal VARCHAR,
    p_atd_last_location TIMESTAMP,
    p_eta_next_destination TIMESTAMP,
    p_timestamp_of_last_location TIMESTAMP,
    p_last_movement_timestamp TIMESTAMP,
    p_loading_port VARCHAR,
    p_discharging_port VARCHAR,
    p_customs_clearance VARCHAR,
    p_bill_of_lading VARCHAR,
    p_last_vessel_name VARCHAR,
    p_last_voyage_number VARCHAR,
    p_current_vessel_name VARCHAR,
    p_current_voyage_number VARCHAR,
    p_last_updated TIMESTAMP
) RETURNS VOID AS $$
BEGIN
    INSERT INTO cnn_container_info (
        container_id, container_type, container_status, shipping_line_name, shipping_line_id, tare,
        shipped_from, shipped_from_terminal, shipped_to, shipped_to_terminal, atd_origin, eta_final_destination,
        last_location, last_location_terminal, next_location, next_location_terminal, atd_last_location,
        eta_next_destination, timestamp_of_last_location, last_movement_timestamp, loading_port, discharging_port,
        customs_clearance, bill_of_lading, last_vessel_name, last_voyage_number, current_vessel_name,
        current_voyage_number, last_updated
    ) VALUES (
        p_container_id, p_container_type, p_container_status, p_shipping_line_name, p_shipping_line_id, p_tare,
        p_shipped_from, p_shipped_from_terminal, p_shipped_to, p_shipped_to_terminal, p_atd_origin, p_eta_final_destination,
        p_last_location, p_last_location_terminal, p_next_location, p_next_location_terminal, p_atd_last_location,
        p_eta_next_destination, p_timestamp_of_last_location, p_last_movement_timestamp, p_loading_port, p_discharging_port,
        p_customs_clearance, p_bill_of_lading, p_last_vessel_name, p_last_voyage_number, p_current_vessel_name,
        p_current_voyage_number, p_last_updated
    );
END;
$$ LANGUAGE plpgsql;

-- Función para insertar datos de posición de buque
CREATE OR REPLACE FUNCTION cnn_insert_vessel_position(
    p_vessel_name VARCHAR,
    p_mmsi VARCHAR,
    p_imo VARCHAR,
    p_lat DOUBLE PRECISION,
    p_lon DOUBLE PRECISION,
    p_navigation_status VARCHAR,
    p_last_position_utc TIMESTAMP,
    p_eta_utc TIMESTAMP,
    p_last_updated TIMESTAMP
) RETURNS VOID AS $$
BEGIN
    INSERT INTO cnn_vessel_position (
        vessel_name, mmsi, imo, lat, lon, navigation_status, last_position_utc, eta_utc, last_updated
    ) VALUES (
        p_vessel_name, p_mmsi, p_imo, p_lat, p_lon, p_navigation_status, p_last_position_utc, p_eta_utc, p_last_updated
    );
END;
$$ LANGUAGE plpgsql;

-- Función para insertar incidencia detectada
CREATE OR REPLACE FUNCTION cnn_insert_vessel_incident(
    p_vessel_name VARCHAR,
    p_navigation_status VARCHAR,
    p_description VARCHAR
) RETURNS VOID AS $$
BEGIN
    INSERT INTO cnn_vessel_incident (
        vessel_name, navigation_status, description
    ) VALUES (
        p_vessel_name, p_navigation_status, p_description
    );
END;
$$ LANGUAGE plpgsql;
