-- ============================================================================
-- SUPABASE CONTAINER TRACKING DATABASE SCHEMA - PROYECTO CNN
-- Script completo para ejecutar de una sola vez
-- v2.0 - Corregido y Ordenado
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. FUNCIONES GENERALES
-- ============================================================================

-- Función para actualizar el campo 'updated_at' automáticamente en cada modificación
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS 
$func$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. DEFINICIÓN DE TABLAS
-- ============================================================================

-- Tabla para datos de facturas (origen puede ser un ERP o sistema externo)
CREATE TABLE public.cnn_factura_tracking (
  id serial NOT NULL PRIMARY KEY,
  titulo character varying(50) NULL,
  proveedor character varying(100) NULL,
  contrato character varying(50) NULL,
  despacho character varying(50) NULL,
  num_contenedor character varying(20) NULL,
  llegada_bquilla date NULL,
  contenedor character varying(20) NULL,
  estado character varying(100) NULL,
  naviera character varying(50) NULL,
  factura character varying(50) NULL,
  etd date NULL,
  eta date NULL,
  dias_transito integer NULL,
  created_at timestamp without time zone NULL DEFAULT CURRENT_TIMESTAMP,
  container_info_id integer NULL
);

-- Tabla principal para la información de tracking de contenedores
CREATE TABLE public.cnn_container_tracking (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  container_number character varying(20) NOT NULL,
  bill_of_lading_number character varying(50) NULL,
  container_type character varying(30) NULL,
  shipped_from character varying(100) NULL,
  shipped_to character varying(100) NULL,
  port_of_load character varying(100) NULL,
  port_of_discharge character varying(100) NULL,
  current_status character varying(100) NULL,
  current_location character varying(100) NULL,
  latest_move character varying(100) NULL,
  pod_eta_date date NULL,
  price_calculation_date date NULL,
  is_delivered boolean NULL DEFAULT false,
  total_events integer NULL DEFAULT 0,
  number_of_containers integer NULL DEFAULT 1,
  tracking_type character varying(20) NULL DEFAULT 'Container'::character varying,
  tracking_date date NULL,
  transhipments jsonb[] NULL,
  route_summary character varying(200) NULL,
  processing_timestamp timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  extracted_at timestamp with time zone NULL,
  statistics jsonb NULL,
  current_status_data jsonb NULL,
  metadata jsonb NULL,
  original_message jsonb NULL,
  CONSTRAINT chk_container_number_format CHECK ((length((container_number)::text) >= 10)),
  CONSTRAINT chk_tracking_type CHECK (((tracking_type)::text = ANY (ARRAY[('Container'::character varying)::text, ('Vessel'::character varying)::text, ('Bill'::character varying)::text])))
);

-- Tabla para los eventos o movimientos de un contenedor
CREATE TABLE public.cnn_container_events (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  container_tracking_id uuid NOT NULL REFERENCES public.cnn_container_tracking(id) ON DELETE CASCADE,
  event_date date NULL,
  event_time time without time zone NULL,
  location character varying(100) NULL,
  port character varying(100) NULL,
  country character varying(5) NULL,
  event_type character varying(100) NULL,
  event_description text NULL,
  vessel_name character varying(100) NULL,
  voyage_number character varying(50) NULL,
  terminal character varying(100) NULL,
  event_sequence integer NULL,
  is_estimated boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  metadata jsonb NULL,
  vessel_data jsonb NULL,
  event_datetime timestamp with time zone NULL,
  vessel_imo text NULL,
  vessel_flag character varying NULL,
  vessel_latitude double precision NULL,
  vessel_longitude double precision NULL,
  vessel_location text NULL,
  vessel_type text NULL,
  vessel_capacity smallint NULL,
  vessel_last_update timestamp with time zone NULL,
  CONSTRAINT chk_event_sequence_positive CHECK ((event_sequence > 0)),
  CONSTRAINT chk_country_code CHECK ((length((country)::text) <= 5))
);

-- Tabla para los buques asociados a un tracking
CREATE TABLE public.cnn_container_vessels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    container_tracking_id UUID NOT NULL REFERENCES public.cnn_container_tracking(id) ON DELETE CASCADE,
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

-- Tabla de resumen para cada tracking
CREATE TABLE public.cnn_tracking_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    container_tracking_id UUID NOT NULL REFERENCES public.cnn_container_tracking(id) ON DELETE CASCADE,
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
    CONSTRAINT chk_total_counts_positive CHECK (total_events >= 0 AND total_ports >= 0 AND total_vessels >= 0 AND transhipment_count >= 0),
    CONSTRAINT chk_dates_logical CHECK (first_event_date IS NULL OR last_event_date IS NULL OR first_event_date <= last_event_date)
);

-- Tabla para metadatos del proceso de tracking
CREATE TABLE public.cnn_container_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    container_tracking_id UUID NOT NULL REFERENCES public.cnn_container_tracking(id) ON DELETE CASCADE,
    total_records JSONB,
    primary_keys JSONB,
    data_quality JSONB,
    original_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_data_quality_completeness CHECK (data_quality IS NULL OR (data_quality->>'completeness')::INTEGER BETWEEN 0 AND 100)
);

-- Tabla para datos de tracking recibidos por correo (similar a factura_tracking)
CREATE TABLE public.cnn_correo_tracking (
  id serial NOT NULL PRIMARY KEY,
  titulo character varying(50) NULL,
  proveedor character varying(100) NULL,
  contrato character varying(50) NULL,
  despacho character varying(50) NULL,
  num_contenedor character varying(20) NULL,
  llegada_bquilla date NULL,
  contenedor character varying(20) NULL,
  estado character varying(100) NULL,
  naviera character varying(50) NULL,
  factura character varying(50) NULL,
  etd date NULL,
  eta date NULL,
  created_at timestamp without time zone NULL DEFAULT CURRENT_TIMESTAMP,
  container_info_id integer NULL
);

-- ============================================================================
-- 3. ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

-- Índices para cnn_container_tracking
CREATE INDEX IF NOT EXISTS idx_cnn_container_tracking_number ON public.cnn_container_tracking(container_number);
CREATE INDEX IF NOT EXISTS idx_cnn_container_tracking_status ON public.cnn_container_tracking(current_status);
CREATE INDEX IF NOT EXISTS idx_cnn_container_tracking_eta ON public.cnn_container_tracking(pod_eta_date);
CREATE INDEX IF NOT EXISTS idx_cnn_container_tracking_delivered ON public.cnn_container_tracking(is_delivered);
CREATE INDEX IF NOT EXISTS idx_cnn_container_tracking_date ON public.cnn_container_tracking(tracking_date);

-- Índices para cnn_container_events
CREATE INDEX IF NOT EXISTS idx_cnn_container_events_tracking_id ON public.cnn_container_events(container_tracking_id);
CREATE INDEX IF NOT EXISTS idx_cnn_container_events_date ON public.cnn_container_events(event_date);
CREATE INDEX IF NOT EXISTS idx_cnn_container_events_location ON public.cnn_container_events(location);
CREATE INDEX IF NOT EXISTS idx_cnn_container_events_sequence ON public.cnn_container_events(container_tracking_id, event_sequence);

-- Índices para cnn_container_vessels
CREATE INDEX IF NOT EXISTS idx_cnn_container_vessels_tracking_id ON public.cnn_container_vessels(container_tracking_id);
CREATE INDEX IF NOT EXISTS idx_cnn_container_vessels_imo ON public.cnn_container_vessels(vessel_imo);
CREATE INDEX IF NOT EXISTS idx_cnn_container_vessels_name ON public.cnn_container_vessels(vessel_name);

-- Índices para cnn_tracking_summary
CREATE INDEX IF NOT EXISTS idx_cnn_tracking_summary_container_id ON public.cnn_tracking_summary(container_tracking_id);
CREATE INDEX IF NOT EXISTS idx_cnn_tracking_summary_container_number ON public.cnn_tracking_summary(container_number);
CREATE INDEX IF NOT EXISTS idx_cnn_tracking_summary_in_transit ON public.cnn_tracking_summary(is_in_transit);
CREATE INDEX IF NOT EXISTS idx_cnn_tracking_summary_estimated_arrival ON public.cnn_tracking_summary(estimated_arrival);

-- ============================================================================
-- 4. TRIGGERS PARA UPDATED_AT AUTOMÁTICO
-- ============================================================================
CREATE TRIGGER update_cnn_container_tracking_updated_at BEFORE UPDATE ON public.cnn_container_tracking FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cnn_container_events_updated_at BEFORE UPDATE ON public.cnn_container_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cnn_container_vessels_updated_at BEFORE UPDATE ON public.cnn_container_vessels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. FUNCIONES PARA MANEJO DE DATOS (CRUD)
-- ============================================================================

-- Función principal para insertar datos desde un JSON
CREATE OR REPLACE FUNCTION public.insert_cnn_container_tracking_data(p_data JSONB)
RETURNS UUID AS 
$main_func$
DECLARE
    v_container_id UUID;
    v_tracking_summary_id UUID;
    v_event JSONB;
    v_vessel JSONB;
    v_tracking_data JSONB := p_data->0;
BEGIN
    -- Insertar en cnn_container_tracking
    INSERT INTO public.cnn_container_tracking (
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
        (v_tracking_data->'container_tracking'->>'pod_eta_date')::DATE,
        COALESCE((v_tracking_data->'container_tracking'->>'is_delivered')::BOOLEAN, false),
        COALESCE((v_tracking_data->'container_tracking'->>'total_events')::INTEGER, 0),
        COALESCE((v_tracking_data->'container_tracking'->>'number_of_containers')::INTEGER, 1),
        COALESCE((v_tracking_data->'container_tracking'->>'tracking_type'), 'Container'),
        (v_tracking_data->'container_tracking'->>'tracking_date')::DATE,
        (SELECT array_agg(value) FROM jsonb_array_elements(v_tracking_data->'container_tracking'->'transhipments')),
        (v_tracking_data->'container_tracking'->>'route_summary'),
        (v_tracking_data->'container_tracking'->>'processing_timestamp')::TIMESTAMPTZ,
        (v_tracking_data->'container_tracking'->>'extracted_at')::TIMESTAMPTZ
    RETURNING id INTO v_container_id;

    -- Insertar eventos
    IF v_tracking_data->'container_events' IS NOT NULL THEN
        FOR v_event IN SELECT * FROM jsonb_array_elements(v_tracking_data->'container_events')
        LOOP
            INSERT INTO public.cnn_container_events (
                container_tracking_id, event_date, location, port, country,
                event_type, event_description, vessel_name, voyage_number,
                terminal, event_sequence, is_estimated
            ) VALUES (
                v_container_id,
                (v_event->>'event_date')::DATE,
                (v_event->>'location'),
                (v_event->>'port'),
                (v_event->>'country'),
                (v_event->>'event_type'),
                (v_event->>'event_description'),
                (v_event->>'vessel_name'),
                (v_event->>'voyage_number'),
                (v_event->>'terminal'),
                (v_event->>'event_sequence')::INTEGER,
                COALESCE((v_event->>'is_estimated')::BOOLEAN, false)
            );
        END LOOP;
    END IF;

    -- Insertar buques
    IF v_tracking_data->'container_vessels' IS NOT NULL THEN
        FOR v_vessel IN SELECT * FROM jsonb_array_elements(v_tracking_data->'container_vessels')
        LOOP
            INSERT INTO public.cnn_container_vessels (
                container_tracking_id, vessel_name, vessel_imo, vessel_flag,
                voyage_number, service_name, vessel_sequence
            ) VALUES (
                v_container_id,
                (v_vessel->>'vessel_name'),
                (v_vessel->>'vessel_imo'),
                (v_vessel->>'vessel_flag'),
                (v_vessel->>'voyage_number'),
                (v_vessel->>'service_name'),
                (v_vessel->>'vessel_sequence')::INTEGER
            );
        END LOOP;
    END IF;

    -- Insertar resumen
    IF v_tracking_data->'tracking_summary' IS NOT NULL THEN
        INSERT INTO public.cnn_tracking_summary (
            container_tracking_id, container_number, last_updated,
            total_events, total_ports, total_vessels, first_event_date,
            last_event_date, estimated_arrival, is_in_transit, current_phase,
            origin_country, destination_country, has_transhipments, transhipment_count
        )
        SELECT
            v_container_id,
            (v_tracking_data->'tracking_summary'->>'container_number'),
            (v_tracking_data->'tracking_summary'->>'last_updated')::TIMESTAMPTZ,
            COALESCE((v_tracking_data->'tracking_summary'->>'total_events')::INTEGER, 0),
            COALESCE((v_tracking_data->'tracking_summary'->>'total_ports')::INTEGER, 0),
            COALESCE((v_tracking_data->'tracking_summary'->>'total_vessels')::INTEGER, 0),
            (v_tracking_data->'tracking_summary'->>'first_event_date')::DATE,
            (v_tracking_data->'tracking_summary'->>'last_event_date')::DATE,
            (v_tracking_data->'tracking_summary'->>'estimated_arrival')::DATE,
            COALESCE((v_tracking_data->'tracking_summary'->>'is_in_transit')::BOOLEAN, false),
            (v_tracking_data->'tracking_summary'->>'current_phase'),
            (v_tracking_data->'tracking_summary'->>'origin_country'),
            (v_tracking_data->'tracking_summary'->>'destination_country'),
            COALESCE((v_tracking_data->'tracking_summary'->>'has_transhipments')::BOOLEAN, false),
            COALESCE((v_tracking_data->'tracking_summary'->>'transhipment_count')::INTEGER, 0)
        RETURNING id INTO v_tracking_summary_id;
    END IF;

    -- Insertar metadatos
    IF v_tracking_data->'metadata' IS NOT NULL THEN
        INSERT INTO public.cnn_container_metadata (
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

-- Función para insertar/actualizar (upsert) un contenedor y sus datos asociados
CREATE OR REPLACE FUNCTION public.upsert_cnn_container_tracking_data(p_data JSONB)
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
    FROM public.cnn_container_tracking 
    WHERE container_number = v_container_number;
    
    -- Si existe, eliminar todos los datos asociados para re-insertarlos (estrategia de refresco total)
    IF v_container_id IS NOT NULL THEN
        DELETE FROM public.cnn_container_tracking WHERE id = v_container_id; -- El ON DELETE CASCADE se encarga del resto
    END IF;
    
    -- Insertar los datos nuevos usando la función principal
    RETURN public.insert_cnn_container_tracking_data(p_data);
END;
$upsert_func$ LANGUAGE plpgsql;


-- ============================================================================
-- 6. VISTAS (VIEWS)
-- ============================================================================

-- Vista que combina datos de facturas con datos de tracking en tiempo real
CREATE OR REPLACE VIEW public.cnn_container_factura_view AS
WITH ranked AS (
    SELECT
      f.id AS factura_id,
      f.titulo,
      f.proveedor,
      f.contrato,
      f.despacho,
      f.num_contenedor,
      f.contenedor,
      f.etd,
      NULL::text AS atd,
      COALESCE(t.pod_eta_date, f.eta) AS eta,
      f.llegada_bquilla,
      f.factura,
      COALESCE(t.current_status, f.estado) AS estado,
      t.current_status AS estado_tracking,
      t.current_location AS ubicacion_actual,
      t.tracking_type,
      t.tracking_date,
      t.route_summary,
      t.transhipments,
      t.is_delivered,
      t.total_events,
      t.number_of_containers,
      f.naviera,
      t.created_at,
      row_number() OVER (PARTITION BY f.num_contenedor, f.contrato ORDER BY t.created_at DESC) AS rn,
      -- Columna calculada para determinar si el contenedor fue entregado en el destino final
      EXISTS (
        SELECT 1
        FROM public.cnn_container_events e
        WHERE e.container_tracking_id = t.id
          AND e.location IS NOT NULL
          AND t.shipped_to IS NOT NULL
          AND lower(trim(e.location)) = lower(trim(t.shipped_to))
          AND e.event_date IS NOT NULL
          AND e.event_date <= CURRENT_DATE
        LIMIT 1
      ) AS entregado
    FROM public.cnn_factura_tracking f
    JOIN public.cnn_container_tracking t ON t.container_number::text = f.num_contenedor::text
)
SELECT
  r.factura_id,
  r.titulo,
  r.proveedor,
  r.contrato,
  r.despacho,
  r.num_contenedor,
  r.contenedor,
  r.etd,
  r.atd,
  r.eta,
  r.llegada_bquilla,
  r.factura,
  r.estado,
  r.estado_tracking,
  r.ubicacion_actual,
  r.tracking_type,
  r.tracking_date,
  r.route_summary,
  r.transhipments,
  r.is_delivered,
  r.total_events,
  r.number_of_containers,
  r.naviera,
  r.created_at,
  r.entregado
FROM ranked r
WHERE r.rn = 1;

-- Vista para el inventario semanal de espacios usados
CREATE OR REPLACE VIEW public.cnn_inventario_espacios_semanal AS
SELECT
    EXTRACT(YEAR FROM f.etd) AS anio,
    EXTRACT(WEEK FROM f.etd) AS semana,
    f.naviera,
    f.proveedor,
    f.llegada_bquilla AS puerto,
    COUNT(*) AS espacios_usados
FROM public.cnn_container_factura_view f
WHERE f.etd IS NOT NULL
GROUP BY anio, semana, f.naviera, f.proveedor, puerto
ORDER BY anio DESC, semana DESC, f.naviera, f.proveedor, puerto;

-- Vista para el acumulado mensual de llegada de contenedores
CREATE OR REPLACE VIEW public.cnn_llegada_contenedores_mensual AS
SELECT
    EXTRACT(YEAR FROM f.llegada_bquilla) AS anio,
    EXTRACT(MONTH FROM f.llegada_bquilla) AS mes,
    f.naviera,
    f.proveedor,
    f.llegada_bquilla AS puerto,
    COUNT(*) AS total_contenedores
FROM public.cnn_container_factura_view f
WHERE f.llegada_bquilla IS NOT NULL
GROUP BY anio, mes, f.naviera, f.proveedor, puerto
ORDER BY anio DESC, mes DESC, f.naviera, f.proveedor, puerto;

-- ============================================================================
-- 7. FINALIZACIÓN DEL SCRIPT
-- ============================================================================
SELECT 'CNN Container Tracking Schema v2.0 creado exitosamente!' as status;