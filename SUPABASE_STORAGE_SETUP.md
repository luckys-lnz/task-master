# Supabase Storage Setup for Profile Pictures

## Prerequisites

1. You need to have a Supabase project set up
2. Environment variables configured

## Environment Variables

Add these to your `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Getting Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **API**
3. Copy the **Project URL** (this is your `NEXT_PUBLIC_SUPABASE_URL`)
4. Copy the **service_role** key (this is your `SUPABASE_SERVICE_ROLE_KEY`)
   - ⚠️ **Important**: Never expose the service role key in client-side code!

## Setting Up the Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Name it: `avatars`
4. Make it **Public** (so images can be accessed via public URLs)
5. Click **Create bucket**

## Storage Policies (Optional but Recommended)

For better security, you can set up RLS (Row Level Security) policies:

1. Go to **Storage** > **Policies** for the `avatars` bucket
2. Create a policy that allows:
   - **INSERT**: Users can upload their own avatars
   - **SELECT**: Public read access
   - **DELETE**: Users can delete their own avatars

Example policy SQL:

```sql
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
```

## Testing

After setup, try uploading a profile picture through the settings page. The image should:
1. Upload to Supabase Storage
2. Return a public URL
3. Display in the user's profile

## Troubleshooting

### "Missing NEXT_PUBLIC_SUPABASE_URL"
- Make sure you've added the environment variable to your `.env` file
- Restart your development server after adding environment variables

### "Missing SUPABASE_SERVICE_ROLE_KEY"
- Make sure you've added the service role key to your `.env` file
- This key is different from the anon key - use the service_role key

### "Bucket not found"
- Make sure you've created the `avatars` bucket in Supabase Storage
- Check that the bucket name matches exactly: `avatars`

### Upload fails with 403/401
- Check that the bucket is set to **Public**
- Verify your service role key is correct
- Check storage policies if you've set up RLS
