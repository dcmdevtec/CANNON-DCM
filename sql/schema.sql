-- Tabla para contenedores consultados
CREATE TABLE cnn_container_info (
    id SERIAL PRIMARY KEY,
    container_id VARCHAR(20) NOT NULL,
    shipping_line_name VARCHAR(100),
    container_status VARCHAR(100),
    shipped_from VARCHAR(100),
    shipped_to VARCHAR(100),
    current_vessel_name VARCHAR(100),
    eta_final_destination TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para posiciones de buques
CREATE TABLE cnn_vessel_position (
    id SERIAL PRIMARY KEY,
    vessel_name VARCHAR(100) NOT NULL,
    mmsi VARCHAR(20),
    imo VARCHAR(20),
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    last_position_utc TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
