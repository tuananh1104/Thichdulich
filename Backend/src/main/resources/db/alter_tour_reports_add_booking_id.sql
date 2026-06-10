ALTER TABLE tour_reports
  ADD COLUMN booking_id VARCHAR(36) NULL AFTER reported_by,
  ADD UNIQUE KEY uq_reports_booking (booking_id),
  ADD CONSTRAINT fk_reports_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
