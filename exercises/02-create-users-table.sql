-- Create a table named "users" with the following columns:
--     fullname     (string)
--     username     (string)        unique, max length = 15
--     email        (string)        primary key
--     password     (string)
--     created_at   (timestamp)     default to current timestamp
--
-- Write your query below:

CREATE TABLE IF NOT EXISTS users (
	fullname VARCHAR NOT NULL,
	username VARCHAR(15) UNIQUE NOT NULL,
	email  VARCHAR PRIMARY KEY,
	password VARCHAR NOT NULL,
	created_at TIMESTAMP DEFAULT now()
);
