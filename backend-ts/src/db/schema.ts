import { pgTable, text, timestamp, jsonb, bigint, varchar } from 'drizzle-orm/pg-core';

// PQS tables are read-only - we query them, not modify them
// These match the PQS schema from Canton

export const events = pgTable('events', {
  eventSequentialId: bigint('event_sequential_id', { mode: 'number' }).primaryKey(),
  eventId: text('event_id').notNull(),
  contractId: text('contract_id').notNull(),
  templateId: text('template_id').notNull(),
  witnessParties: jsonb('witness_parties').notNull(),
  createArguments: jsonb('create_arguments'),
  exerciseArguments: jsonb('exercise_arguments'),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  recordTime: timestamp('record_time').notNull(),
});

export const activeContracts = pgTable('active_contracts', {
  contractId: text('contract_id').primaryKey(),
  templateId: text('template_id').notNull(),
  createArguments: jsonb('create_arguments').notNull(),
  signatories: jsonb('signatories').notNull(),
  observers: jsonb('observers').notNull(),
  createdAt: timestamp('created_at').notNull(),
});

// Add custom tables for app-specific needs (optional)
export const tenantRegistrations = pgTable('tenant_registrations', {
  id: text('id').primaryKey(),
  partyId: text('party_id').notNull().unique(),
  identityProviderId: text('identity_provider_id').notNull(),
  registeredAt: timestamp('registered_at').notNull().defaultNow(),
  metadata: jsonb('metadata'),
});
