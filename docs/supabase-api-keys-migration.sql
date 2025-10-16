-- Create API Keys Table
-- Store hashed API keys for secure authentication

CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON public.api_keys(is_active);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own API keys
CREATE POLICY "Users can view own API keys"
ON public.api_keys
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own API keys
CREATE POLICY "Users can create own API keys"
ON public.api_keys
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own API keys
CREATE POLICY "Users can update own API keys"
ON public.api_keys
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own API keys
CREATE POLICY "Users can delete own API keys"
ON public.api_keys
FOR DELETE
USING (auth.uid() = user_id);

-- Function to update last_used_at and usage_count
CREATE OR REPLACE FUNCTION public.update_api_key_usage(p_key_hash TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.api_keys
    SET
        last_used_at = NOW(),
        usage_count = usage_count + 1
    WHERE key_hash = p_key_hash AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE public.api_keys IS 'Store hashed API keys for secure authentication';
COMMENT ON COLUMN public.api_keys.key_hash IS 'SHA256 hash of the API key';
COMMENT ON COLUMN public.api_keys.is_active IS 'Whether the API key is currently active';
COMMENT ON COLUMN public.api_keys.usage_count IS 'Number of times this key has been used';
