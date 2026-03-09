CREATE TABLE users (
id INT AUTO_INCREMENT PRIMARY KEY,
ldap_username VARCHAR(100),
email VARCHAR(150),
full_name VARCHAR(150)
);

CREATE TABLE clients (
id INT AUTO_INCREMENT PRIMARY KEY,
client_name VARCHAR(150),
description TEXT
);

CREATE TABLE tickets (
id INT AUTO_INCREMENT PRIMARY KEY,
jira_ticket_id VARCHAR(100),
title VARCHAR(255),
status VARCHAR(50),
client_id INT,
user_id INT,
time_spent_jira FLOAT
);

CREATE TABLE time_entries (
id INT AUTO_INCREMENT PRIMARY KEY,
chronos_entry_id VARCHAR(100),
user_id INT,
client_id INT,
hours_logged FLOAT,
date DATE
);

CREATE TABLE comparisons (
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT,
jira_hours FLOAT,
chronos_hours FLOAT,
difference FLOAT
);