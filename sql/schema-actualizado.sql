--
-- Name: cnn_container_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cnn_container_events (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    container_tracking_id uuid NOT NULL,
    event_date date,
    event_time time without time zone,
    location character varying(100),
    port character varying(100),
    country character varying(5),
    event_type character varying(100),
    event_description text,
    vessel_name character varying(100),
    voyage_number character varying(50),
    terminal character varying(100),
    event_sequence integer,
    is_estimated boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    metadata json,
    vessel_data json,
    event_datetime timestamp with time zone,
    vessel_imo text,
    vessel_flag character varying,
    vessel_latitude double precision,
    vessel_longitude double precision,
    vessel_location text,
    vessel_type text,
    vessel_capacity smallint,
    vessel_last_update timestamp with time zone,
    CONSTRAINT chk_country_code CHECK ((length((country)::text) <= 5)),
    CONSTRAINT chk_event_sequence_positive CHECK ((event_sequence > 0))
);


--
-- Name: cnn_container_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cnn_container_tracking (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    container_number character varying(20) NOT NULL,
    bill_of_lading_number character varying(50),
    container_type character varying(30),
    shipped_from character varying(100),
    shipped_to character varying(100),
    port_of_load character varying(100),
    port_of_discharge character varying(100),
    current_status character varying(100),
    current_location character varying(100),
    latest_move character varying(100),
    pod_eta_date date,
    price_calculation_date date,
    is_delivered boolean DEFAULT false,
    total_events integer DEFAULT 0,
    number_of_containers integer DEFAULT 1,
    tracking_type character varying(20) DEFAULT 'Container'::character varying,
    tracking_date date,
    transhipments json[],
    route_summary character varying(200),
    processing_timestamp timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    extracted_at timestamp with time zone,
    statistics jsonb,
    current_status_data jsonb,
    metadata jsonb,
    original_message jsonb,
    hasarrived boolean,
    eta_date date,
    transit_days smallint,
    on_time_performance text,
    delay_days smallint,
    delivery_status text,
    message text,
    arrived_at_destination boolean DEFAULT false,
    arrival_date date,
    delivery_date date,
    delivery_confidence text,
    status_reason text,
    CONSTRAINT chk_container_number_format CHECK ((length((container_number)::text) >= 10)),
    CONSTRAINT chk_tracking_type CHECK (((tracking_type)::text = ANY (ARRAY[('Container'::character varying)::text, ('Vessel'::character varying)::text, ('Bill'::character varying)::text])))
);


--
-- Name: cnn_factura_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cnn_factura_tracking (
    id integer NOT NULL,
    titulo character varying(50),
    proveedor character varying(100),
    contrato character varying(50),
    despacho character varying(50),
    num_contenedor character varying(20),
    llegada_bquilla date,
    contenedor character varying(20),
    estado character varying(100),
    naviera character varying(50),
    factura character varying(50),
    etd date,
    eta date,
    dias_transito integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    container_info_id integer
);

CREATE INDEX idx_cnn_container_events_date ON public.cnn_container_events USING btree (event_date);


--
-- Name: idx_cnn_container_events_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cnn_container_events_location ON public.cnn_container_events USING btree (location);


--
-- Name: idx_cnn_container_events_sequence; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cnn_container_events_sequence ON public.cnn_container_events USING btree (container_tracking_id, event_sequence);


--
-- Name: idx_cnn_container_events_tracking_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cnn_container_events_tracking_id ON public.cnn_container_events USING btree (container_tracking_id);


--
-- Name: idx_cnn_container_tracking_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cnn_container_tracking_active ON public.cnn_container_tracking USING btree (current_status) WHERE ((current_status)::text <> ALL (ARRAY[('ARRIBO_A_DESTINO'::character varying)::text, ('ENTREGADO'::character varying)::text]));


--
-- Name: idx_cnn_container_tracking_arrived; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cnn_container_tracking_arrived ON public.cnn_container_tracking USING btree (arrived_at_destination);


--
-- Name: idx_cnn_container_tracking_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cnn_container_tracking_date ON public.cnn_container_tracking USING btree (tracking_date);


--
-- Name: idx_cnn_container_tracking_delivered; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cnn_container_tracking_delivered ON public.cnn_container_tracking USING btree (is_delivered);


--
-- Name: idx_cnn_container_tracking_delivery_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cnn_container_tracking_delivery_status ON public.cnn_container_tracking USING btree (delivery_status);


--
-- Name: idx_cnn_container_tracking_eta; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cnn_container_tracking_eta ON public.cnn_container_tracking USING btree (pod_eta_date);


--
-- Name: idx_cnn_container_tracking_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cnn_container_tracking_number ON public.cnn_container_tracking USING btree (container_number);


--
-- Name: idx_cnn_container_tracking_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cnn_container_tracking_status ON public.cnn_container_tracking USING btree (current_status);


--
-- Name: idx_cnn_container_vessels_imo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cnn_container_vessels_imo ON public.cnn_container_vessels USING btree (vessel_imo);


--
-- Name: idx_cnn_container_vessels_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cnn_container_vessels_name ON public.cnn_container_vessels USING btree (vessel_name);


--
-- Name: idx_cnn_container_vessels_tracking_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cnn_container_vessels_tracking_id ON public.cnn_container_vessels USING btree (container_tracking_id);


--
-- Name: idx_cnn_tracking_summary_container_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cnn_tracking_summary_container_id ON public.cnn_tracking_summary USING btree (container_tracking_id);


--
-- Name: idx_cnn_tracking_summary_container_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cnn_tracking_summary_container_number ON public.cnn_tracking_summary USING btree (container_number);


--
-- Name: idx_cnn_tracking_summary_estimated_arrival; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cnn_tracking_summary_estimated_arrival ON public.cnn_tracking_summary USING btree (estimated_arrival);


--
-- Name: idx_cnn_tracking_summary_in_transit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cnn_tracking_summary_in_transit ON public.cnn_tracking_summary USING btree (is_in_transit);