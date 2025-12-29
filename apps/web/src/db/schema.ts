import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  stravaId: integer('strava_id').unique().notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  tokenExpiresAt: integer('token_expires_at').notNull(),
  athleteName: text('athlete_name'),
  athleteProfile: text('athlete_profile'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const activities = sqliteTable('activities', {
  id: integer('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  stravaId: integer('strava_id').unique().notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  sportType: text('sport_type'),
  distance: integer('distance'), // in meters
  movingTime: integer('moving_time'), // in seconds
  elapsedTime: integer('elapsed_time'), // in seconds
  totalElevationGain: integer('total_elevation_gain'), // in meters
  startDate: text('start_date').notNull(),
  startDateLocal: text('start_date_local').notNull(),
  timezone: text('timezone'),
  kudosCount: integer('kudos_count'),
  averageSpeed: integer('average_speed'), // stored as integer (m/s * 1000)
  maxSpeed: integer('max_speed'),
  averageHeartrate: integer('average_heartrate'),
  maxHeartrate: integer('max_heartrate'),
  averageWatts: integer('average_watts'),
  maxWatts: integer('max_watts'),
  weightedAverageWatts: integer('weighted_average_watts'),
  data: text('data', { mode: 'json' }), // full activity JSON
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
