-- ============================================================================
-- SUPABASE CONTAINER TRACKING DATABASE SCHEMA - PROYECTO CNN
-- Script completo para ejecutar de una sola vez
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

create table public.cnn_factura_tracking (
  id serial not null,
  titulo character varying(50) null,
  proveedor character varying(100) null,
  contrato character varying(50) null,
  despacho character varying(50) null,
  num_contenedor character varying(20) null,
  llegada_bquilla date null,
  contenedor character varying(20) null,
  estado character varying(100) null,
  naviera character varying(50) null,
  factura character varying(50) null,
  etd date null,
  eta date null,
  dias_transito integer null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  container_info_id integer null,
) TABLESPACE pg_default;
-- ============================================================================
-- 1. TABLA PRINCIPAL: CNN_CONTAINER_TRACKING
-- ============================================================================
CREATE TABLE CNN_container_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    container_number VARCHAR(20) NOT NULL,
    bill_of_lading_number VARCHAR(50),
    container_type VARCHAR(30),
    shipped_from VARCHAR(100),
    shipped_to VARCHAR(100),
    port_of_load VARCHAR(100),
    port_of_discharge VARCHAR(100),
    current_status VARCHAR(100),
    current_location VARCHAR(100),
    latest_move VARCHAR(100),
    pod_eta_date DATE,
    price_calculation_date DATE,
    is_delivered BOOLEAN DEFAULT false,
    total_events INTEGER DEFAULT 0,
    number_of_containers INTEGER DEFAULT 1,
    tracking_type VARCHAR(20) DEFAULT 'Container',
    tracking_date DATE,
    transhipments TEXT[],
    route_summary VARCHAR(200),
    processing_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    extracted_at TIMESTAMPTZ,
    
    CONSTRAINT chk_container_number_format CHECK (LENGTH(container_number) >= 10),
    CONSTRAINT chk_tracking_type CHECK (tracking_type IN ('Container', 'Vessel', 'Bill'))
);

-- ============================================================================
-- 2. TABLA: CNN_CONTAINER_EVENTS
-- ============================================================================
CREATE TABLE CNN_container_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    container_tracking_id UUID NOT NULL REFERENCES CNN_container_tracking(id) ON DELETE CASCADE,
    event_date DATE,
    event_time TIME,
    location VARCHAR(100),
    port VARCHAR(100),
    country VARCHAR(5),
    event_type VARCHAR(100),
    event_description TEXT,
    vessel_name VARCHAR(100),
    voyage_number VARCHAR(50),
    terminal VARCHAR(100),
    event_sequence INTEGER,
    is_estimated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT chk_event_sequence_positive CHECK (event_sequence > 0),
    CONSTRAINT chk_country_code CHECK (LENGTH(country) <= 5)
);

-- ============================================================================
-- 3. TABLA: CNN_CONTAINER_VESSELS
-- ============================================================================
CREATE TABLE CNN_container_vessels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    container_tracking_id UUID NOT NULL REFERENCES CNN_container_tracking(id) ON DELETE CASCADE,
    vessel_name VARCHAR(100) NOT NULL,
    vessel_imo VARCHAR(20),
    vessel_flag VARCHAR(5),
    voyage_number VARCHAR(50),
    service_name VARCHAR(100),
    vessel_sequence INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT chk_vessel_imo_format CHECK (vessel_imo IS NULL OR LENGTH(vessel_imo) >= 7),
    CONSTRAINT chk_vessel_sequence_positive CHECK (vessel_sequence > 0)
);

-- ============================================================================
-- 4. TABLA: CNN_TRACKING_SUMMARY
-- ============================================================================
CREATE TABLE CNN_tracking_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    container_tracking_id UUID NOT NULL REFERENCES CNN_container_tracking(id) ON DELETE CASCADE,
    container_number VARCHAR(20) NOT NULL,
    last_updated TIMESTAMPTZ,
    total_events INTEGER DEFAULT 0,
    total_ports INTEGER DEFAULT 0,
    total_vessels INTEGER DEFAULT 0,
    first_event_date DATE,
    last_event_date DATE,
    estimated_arrival DATE,
    is_in_transit BOOLEAN DEFAULT false,
    current_phase VARCHAR(100),
    origin_country VARCHAR(5),
    destination_country VARCHAR(5),
    has_transhipments BOOLEAN DEFAULT false,
    transhipment_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT chk_total_counts_positive CHECK (
        total_events >= 0 AND 
        total_ports >= 0 AND 
        total_vessels >= 0 AND 
        transhipment_count >= 0
    ),
    CONSTRAINT chk_dates_logical CHECK (
        first_event_date IS NULL OR 
        last_event_date IS NULL OR 
        first_event_date <= last_event_date
    )
);

-- ============================================================================
-- 5. TABLA: CNN_CONTAINER_METADATA
-- ============================================================================
CREATE TABLE CNN_container_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    container_tracking_id UUID NOT NULL REFERENCES CNN_container_tracking(id) ON DELETE CASCADE,
    total_records JSONB,
    primary_keys JSONB,
    data_quality JSONB,
    original_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT chk_data_quality_completeness CHECK (
        data_quality IS NULL OR 
        (data_quality->>'completeness')::INTEGER BETWEEN 0 AND 100
    )
);

-- ============================================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

-- Índices para CNN_container_tracking
CREATE INDEX idx_CNN_container_tracking_number ON CNN_container_tracking(container_number);
CREATE INDEX idx_CNN_container_tracking_status ON CNN_container_tracking(current_status);
CREATE INDEX idx_CNN_container_tracking_eta ON CNN_container_tracking(pod_eta_date);
CREATE INDEX idx_CNN_container_tracking_delivered ON CNN_container_tracking(is_delivered);
CREATE INDEX idx_CNN_container_tracking_date ON CNN_container_tracking(tracking_date);

-- Índices para CNN_container_events
CREATE INDEX idx_CNN_container_events_tracking_id ON CNN_container_events(container_tracking_id);
CREATE INDEX idx_CNN_container_events_date ON CNN_container_events(event_date);
CREATE INDEX idx_CNN_container_events_location ON CNN_container_events(location);
CREATE INDEX idx_CNN_container_events_sequence ON CNN_container_events(container_tracking_id, event_sequence);

-- Índices para CNN_container_vessels
CREATE INDEX idx_CNN_container_vessels_tracking_id ON CNN_container_vessels(container_tracking_id);
CREATE INDEX idx_CNN_container_vessels_imo ON CNN_container_vessels(vessel_imo);
CREATE INDEX idx_CNN_container_vessels_name ON CNN_container_vessels(vessel_name);

-- Índices para CNN_tracking_summary
CREATE INDEX idx_CNN_tracking_summary_container_id ON CNN_tracking_summary(container_tracking_id);
CREATE INDEX idx_CNN_tracking_summary_container_number ON CNN_tracking_summary(container_number);
CREATE INDEX idx_CNN_tracking_summary_in_transit ON CNN_tracking_summary(is_in_transit);
CREATE INDEX idx_CNN_tracking_summary_estimated_arrival ON CNN_tracking_summary(estimated_arrival);

-- ============================================================================
-- FUNCIÓN PARA UPDATED_AT AUTOMÁTICO
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS 
$func$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================================================
CREATE TRIGGER update_CNN_container_tracking_updated_at 
    BEFORE UPDATE ON CNN_container_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_CNN_container_events_updated_at 
    BEFORE UPDATE ON CNN_container_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_CNN_container_vessels_updated_at 
    BEFORE UPDATE ON CNN_container_vessels 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCIÓN PRINCIPAL PARA INSERTAR DATOS DEL JSON
-- ============================================================================
CREATE OR REPLACE FUNCTION insert_CNN_container_tracking_data(p_data JSONB)
RETURNS UUID AS 
$main_func$
DECLARE
    v_container_id UUID;
    v_tracking_summary_id UUID;
    v_event JSONB;
    v_vessel JSONB;
    v_tracking_data JSONB := p_data->0;
BEGIN
    -- Insertar CNN_container_tracking
    INSERT INTO CNN_container_tracking (
        container_number, bill_of_lading_number, container_type,
        shipped_from, shipped_to, port_of_load, port_of_discharge,
        current_status, current_location, latest_move, pod_eta_date,
        is_delivered, total_events, number_of_containers,
        tracking_type, tracking_date, transhipments, route_summary,
        processing_timestamp, extracted_at
    )
    SELECT 
        (v_tracking_data->'container_tracking'->>'container_number'),
        (v_tracking_data->'container_tracking'->>'bill_of_lading_number'),
        (v_tracking_data->'container_tracking'->>'container_type'),
        (v_tracking_data->'container_tracking'->>'shipped_from'),
        (v_tracking_data->'container_tracking'->>'shipped_to'),
        (v_tracking_data->'container_tracking'->>'port_of_load'),
        (v_tracking_data->'container_tracking'->>'port_of_discharge'),
        (v_tracking_data->'container_tracking'->>'current_status'),
        (v_tracking_data->'container_tracking'->>'current_location'),
        (v_tracking_data->'container_tracking'->>'latest_move'),
        CASE 
            WHEN (v_tracking_data->'container_tracking'->>'pod_eta_date') IS NULL THEN NULL
            ELSE (v_tracking_data->'container_tracking'->>'pod_eta_date')::DATE
        END,
        COALESCE((v_tracking_data->'container_tracking'->>'is_delivered')::BOOLEAN, false),
        COALESCE((v_tracking_data->'container_tracking'->>'total_events')::INTEGER, 0),
        COALESCE((v_tracking_data->'container_tracking'->>'number_of_containers')::INTEGER, 1),
        COALESCE((v_tracking_data->'container_tracking'->>'tracking_type'), 'Container'),
        CASE 
            WHEN (v_tracking_data->'container_tracking'->>'tracking_date') IS NULL THEN NULL
            ELSE (v_tracking_data->'container_tracking'->>'tracking_date')::DATE
        END,
        CASE 
            WHEN v_tracking_data->'container_tracking'->'transhipments' IS NULL THEN NULL
            ELSE ARRAY(SELECT jsonb_array_elements_text(v_tracking_data->'container_tracking'->'transhipments'))
        END,
        (v_tracking_data->'container_tracking'->>'route_summary'),
        CASE 
            WHEN (v_tracking_data->'container_tracking'->>'processing_timestamp') IS NULL THEN NULL
            ELSE (v_tracking_data->'container_tracking'->>'processing_timestamp')::TIMESTAMPTZ
        END,
        CASE 
            WHEN (v_tracking_data->'container_tracking'->>'extracted_at') IS NULL THEN NULL
            ELSE (v_tracking_data->'container_tracking'->>'extracted_at')::TIMESTAMPTZ
        END
    RETURNING id INTO v_container_id;

    -- Insertar eventos
    IF v_tracking_data->'container_events' IS NOT NULL THEN
        FOR v_event IN SELECT * FROM jsonb_array_elements(v_tracking_data->'container_events')
        LOOP
            INSERT INTO CNN_container_events (
                container_tracking_id, event_date, location, port, country,
                event_type, event_description, vessel_name, voyage_number,
                terminal, event_sequence, is_estimated
            ) VALUES (
                v_container_id,
                CASE 
                    WHEN (v_event->>'event_date') IS NULL THEN NULL
                    ELSE (v_event->>'event_date')::DATE
                END,
                (v_event->>'location'),
                (v_event->>'port'),
                (v_event->>'country'),
                (v_event->>'event_type'),
                (v_event->>'event_description'),
                (v_event->>'vessel_name'),
                (v_event->>'voyage_number'),
                (v_event->>'terminal'),
                CASE 
                    WHEN (v_event->>'event_sequence') IS NULL THEN NULL
                    ELSE (v_event->>'event_sequence')::INTEGER
                END,
                COALESCE((v_event->>'is_estimated')::BOOLEAN, false)
            );
        END LOOP;
    END IF;

    -- Insertar buques
    IF v_tracking_data->'container_vessels' IS NOT NULL THEN
        FOR v_vessel IN SELECT * FROM jsonb_array_elements(v_tracking_data->'container_vessels')
        LOOP
            INSERT INTO CNN_container_vessels (
                container_tracking_id, vessel_name, vessel_imo, vessel_flag,
                voyage_number, service_name, vessel_sequence
            ) VALUES (
                v_container_id,
                (v_vessel->>'vessel_name'),
                (v_vessel->>'vessel_imo'),
                (v_vessel->>'vessel_flag'),
                (v_vessel->>'voyage_number'),
                (v_vessel->>'service_name'),
                CASE 
                    WHEN (v_vessel->>'vessel_sequence') IS NULL THEN NULL
                    ELSE (v_vessel->>'vessel_sequence')::INTEGER
                END
            );
        END LOOP;
    END IF;

    -- Insertar CNN_tracking_summary
    IF v_tracking_data->'tracking_summary' IS NOT NULL THEN
        INSERT INTO CNN_tracking_summary (
            container_tracking_id, container_number, last_updated,
            total_events, total_ports, total_vessels, first_event_date,
            last_event_date, estimated_arrival, is_in_transit, current_phase,
            origin_country, destination_country, has_transhipments, transhipment_count
        )
        SELECT
            v_container_id,
            (v_tracking_data->'tracking_summary'->>'container_number'),
            CASE 
                WHEN (v_tracking_data->'tracking_summary'->>'last_updated') IS NULL THEN NULL
                ELSE (v_tracking_data->'tracking_summary'->>'last_updated')::TIMESTAMPTZ
            END,
            COALESCE((v_tracking_data->'tracking_summary'->>'total_events')::INTEGER, 0),
            COALESCE((v_tracking_data->'tracking_summary'->>'total_ports')::INTEGER, 0),
            COALESCE((v_tracking_data->'tracking_summary'->>'total_vessels')::INTEGER, 0),
            CASE 
                WHEN (v_tracking_data->'tracking_summary'->>'first_event_date') IS NULL THEN NULL
                ELSE (v_tracking_data->'tracking_summary'->>'first_event_date')::DATE
            END,
            CASE 
                WHEN (v_tracking_data->'tracking_summary'->>'last_event_date') IS NULL THEN NULL
                ELSE (v_tracking_data->'tracking_summary'->>'last_event_date')::DATE
            END,
            CASE 
                WHEN (v_tracking_data->'tracking_summary'->>'estimated_arrival') IS NULL THEN NULL
                ELSE (v_tracking_data->'tracking_summary'->>'estimated_arrival')::DATE
            END,
            COALESCE((v_tracking_data->'tracking_summary'->>'is_in_transit')::BOOLEAN, false),
            (v_tracking_data->'tracking_summary'->>'current_phase'),
            (v_tracking_data->'tracking_summary'->>'origin_country'),
            (v_tracking_data->'tracking_summary'->>'destination_country'),
            COALESCE((v_tracking_data->'tracking_summary'->>'has_transhipments')::BOOLEAN, false),
            COALESCE((v_tracking_data->'tracking_summary'->>'transhipment_count')::INTEGER, 0)
        RETURNING id INTO v_tracking_summary_id;
    END IF;

    -- Insertar metadata
    IF v_tracking_data->'metadata' IS NOT NULL THEN
        INSERT INTO CNN_container_metadata (
            container_tracking_id, total_records, primary_keys, 
            data_quality, original_message
        ) VALUES (
            v_container_id,
            v_tracking_data->'metadata'->'total_records',
            v_tracking_data->'metadata'->'primary_keys',
            v_tracking_data->'metadata'->'data_quality',
            (v_tracking_data->'metadata'->>'original_message')
        );
    END IF;

    RETURN v_container_id;
END;
$main_func$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN AUXILIAR PARA INSERTAR/ACTUALIZAR CONTENEDOR
-- ============================================================================
CREATE OR REPLACE FUNCTION upsert_CNN_container_tracking_data(p_data JSONB)
RETURNS UUID AS 
$upsert_func$
DECLARE
    v_container_id UUID;
    v_container_number VARCHAR(20);
    v_tracking_data JSONB := p_data->0;
BEGIN
    v_container_number := (v_tracking_data->'container_tracking'->>'container_number');
    
    -- Verificar si el contenedor ya existe
    SELECT id INTO v_container_id 
    FROM CNN_container_tracking 
    WHERE container_number = v_container_number;
    
    IF v_container_id IS NOT NULL THEN
        -- Si existe, eliminar datos relacionados y re-insertar
        DELETE FROM CNN_container_events WHERE container_tracking_id = v_container_id;
        DELETE FROM CNN_container_vessels WHERE container_tracking_id = v_container_id;
        DELETE FROM CNN_tracking_summary WHERE container_tracking_id = v_container_id;
        DELETE FROM CNN_container_metadata WHERE container_tracking_id = v_container_id;
        DELETE FROM CNN_container_tracking WHERE id = v_container_id;
    END IF;
    
    -- Insertar datos nuevos
    RETURN insert_CNN_container_tracking_data(p_data);
END;
$upsert_func$ LANGUAGE plpgsql;

-- ============================================================================
-- FINALIZACIÓN DEL SCRIPT
-- ============================================================================

-- Comentario de verificación
SELECT 'CNN Container Tracking Schema creado exitosamente!' as status;