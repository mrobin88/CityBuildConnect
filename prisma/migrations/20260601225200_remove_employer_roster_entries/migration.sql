-- Remove the unused employer roster feature.
-- Dropping the table also removes its indexes and foreign key constraints.
DROP TABLE IF EXISTS "EmployerRosterEntry";
