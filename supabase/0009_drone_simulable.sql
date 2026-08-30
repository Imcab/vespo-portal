-- VespoUAV: "available in simulation" belongs to the drone as a whole, not
-- to each individual configuration file. Move the flag accordingly.

alter table drones add column if not exists simulable boolean not null default false;
alter table stl_files drop column if exists simulable;
