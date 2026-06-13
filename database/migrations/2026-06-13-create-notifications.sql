CREATE TABLE IF NOT EXISTS notifications (
  id            VARCHAR(36)  NOT NULL,
  user_id       VARCHAR(36)  NOT NULL,
  type          VARCHAR(50)  NOT NULL,
  title         VARCHAR(150) NOT NULL,
  message       TEXT         NOT NULL,
  link          VARCHAR(255) NULL,
  metadata_json TEXT         NULL,
  read_at       DATETIME     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_notifications_user_created (user_id, created_at),
  INDEX idx_notifications_user_read (user_id, read_at),
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);
