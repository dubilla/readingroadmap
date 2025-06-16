--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Homebrew)
-- Dumped by pg_dump version 14.17 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: dubilla
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO dubilla;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: dubilla
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO dubilla;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: dubilla
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE drizzle.__drizzle_migrations_id_seq OWNER TO dubilla;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: dubilla
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: books; Type: TABLE; Schema: public; Owner: dubilla
--

CREATE TABLE public.books (
    id integer NOT NULL,
    title text NOT NULL,
    author text NOT NULL,
    pages integer NOT NULL,
    cover_url text NOT NULL,
    status text NOT NULL,
    user_id integer NOT NULL,
    lane_id integer,
    reading_progress integer DEFAULT 0,
    goodreads_id text,
    estimated_minutes integer NOT NULL,
    added_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.books OWNER TO dubilla;

--
-- Name: books_id_seq; Type: SEQUENCE; Schema: public; Owner: dubilla
--

CREATE SEQUENCE public.books_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.books_id_seq OWNER TO dubilla;

--
-- Name: books_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dubilla
--

ALTER SEQUENCE public.books_id_seq OWNED BY public.books.id;


--
-- Name: lanes; Type: TABLE; Schema: public; Owner: dubilla
--

CREATE TABLE public.lanes (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    "order" integer NOT NULL,
    type text NOT NULL,
    swimlane_id integer
);


ALTER TABLE public.lanes OWNER TO dubilla;

--
-- Name: lanes_id_seq; Type: SEQUENCE; Schema: public; Owner: dubilla
--

CREATE SEQUENCE public.lanes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.lanes_id_seq OWNER TO dubilla;

--
-- Name: lanes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dubilla
--

ALTER SEQUENCE public.lanes_id_seq OWNED BY public.lanes.id;


--
-- Name: swimlanes; Type: TABLE; Schema: public; Owner: dubilla
--

CREATE TABLE public.swimlanes (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    "order" integer NOT NULL,
    user_id integer
);


ALTER TABLE public.swimlanes OWNER TO dubilla;

--
-- Name: swimlanes_id_seq; Type: SEQUENCE; Schema: public; Owner: dubilla
--

CREATE SEQUENCE public.swimlanes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.swimlanes_id_seq OWNER TO dubilla;

--
-- Name: swimlanes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dubilla
--

ALTER SEQUENCE public.swimlanes_id_seq OWNED BY public.swimlanes.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: dubilla
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    hashed_password text NOT NULL,
    name text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO dubilla;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: dubilla
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO dubilla;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dubilla
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: dubilla
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: books id; Type: DEFAULT; Schema: public; Owner: dubilla
--

ALTER TABLE ONLY public.books ALTER COLUMN id SET DEFAULT nextval('public.books_id_seq'::regclass);


--
-- Name: lanes id; Type: DEFAULT; Schema: public; Owner: dubilla
--

ALTER TABLE ONLY public.lanes ALTER COLUMN id SET DEFAULT nextval('public.lanes_id_seq'::regclass);


--
-- Name: swimlanes id; Type: DEFAULT; Schema: public; Owner: dubilla
--

ALTER TABLE ONLY public.swimlanes ALTER COLUMN id SET DEFAULT nextval('public.swimlanes_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: dubilla
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: dubilla
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
\.


--
-- Data for Name: books; Type: TABLE DATA; Schema: public; Owner: dubilla
--

COPY public.books (id, title, author, pages, cover_url, status, user_id, lane_id, reading_progress, goodreads_id, estimated_minutes, added_at) FROM stdin;
\.


--
-- Data for Name: lanes; Type: TABLE DATA; Schema: public; Owner: dubilla
--

COPY public.lanes (id, name, description, "order", type, swimlane_id) FROM stdin;
1	Backlog	Books to read eventually	0	backlog	1
2	Currently Reading	Books in progress	1	in-progress	1
3	Read	Finished books	999	completed	\N
\.


--
-- Data for Name: swimlanes; Type: TABLE DATA; Schema: public; Owner: dubilla
--

COPY public.swimlanes (id, name, description, "order", user_id) FROM stdin;
1	General Reading	General books to read	0	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: dubilla
--

COPY public.users (id, email, hashed_password, name, created_at) FROM stdin;
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: dubilla
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 1, false);


--
-- Name: books_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dubilla
--

SELECT pg_catalog.setval('public.books_id_seq', 4, true);


--
-- Name: lanes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dubilla
--

SELECT pg_catalog.setval('public.lanes_id_seq', 3, true);


--
-- Name: swimlanes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dubilla
--

SELECT pg_catalog.setval('public.swimlanes_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dubilla
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: dubilla
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: dubilla
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- Name: lanes lanes_pkey; Type: CONSTRAINT; Schema: public; Owner: dubilla
--

ALTER TABLE ONLY public.lanes
    ADD CONSTRAINT lanes_pkey PRIMARY KEY (id);


--
-- Name: swimlanes swimlanes_pkey; Type: CONSTRAINT; Schema: public; Owner: dubilla
--

ALTER TABLE ONLY public.swimlanes
    ADD CONSTRAINT swimlanes_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: dubilla
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: dubilla
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

