-- Add queued document lifecycle status. Follow-up schema changes that use this
-- enum value live in the next migration because PostgreSQL requires a commit
-- before a newly added enum value can be used as a default.
ALTER TYPE "DocumentStatus" ADD VALUE IF NOT EXISTS 'QUEUED';
