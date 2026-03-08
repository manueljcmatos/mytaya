-- Add telegram_message_id column for tracking sent Telegram messages per prediction
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS telegram_message_id BIGINT;
