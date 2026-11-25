CREATE TABLE cars (
  id                uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate     text      NOT NULL UNIQUE,
  brand             text      NOT NULL,
  model             text      NOT NULL,
  year              text      NOT NULL,
  price_per_day     integer   NOT NULL CHECK (price_per_day >=0),
  image_key         text,
  REMAKE            text      NOT NULL,
  created_at     timestamptz  NOT NULL DEFAULT now(),
  updated_at     timestamptz  NOT NULL DEFAULT now()
);

