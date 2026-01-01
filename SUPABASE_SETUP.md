# Supabase Integration

Your Deep Live Cam app is now connected to Supabase for data persistence and storage.

## Database Connection

**Project URL:** `https://goqizvxmjvbgxuvzkiom.supabase.co`

The app automatically connects using credentials stored in `.env` file.

## Database Tables

### 1. media_items
Stores captured photos and videos from the webcam.

**Columns:**
- `id` - Unique identifier
- `user_id` - References authenticated user
- `media_type` - 'photo' or 'video'
- `file_path` - Path to file in Supabase storage
- `file_size` - File size in bytes
- `duration` - Video duration (null for photos)
- `thumbnail_path` - Optional thumbnail
- `created_at` - Timestamp

**Security:** Users can only view, create, and delete their own media.

### 2. capture_settings
Stores user preferences for camera filters and settings.

**Columns:**
- `id` - Unique identifier
- `user_id` - References authenticated user
- `filter_name` - 'none', 'blur', 'brightness', 'contrast'
- `filter_value` - Numeric filter value
- `face_detection_enabled` - Boolean flag
- `created_at` - Timestamp

**Security:** Users can manage only their own settings.

### 3. face_swap_results
Stores face swap processing history.

**Columns:**
- `id` - Unique identifier
- `user_id` - References authenticated user
- `source_face_path` - Path to source face image
- `target_image_path` - Path to target image
- `result_path` - Path to result image
- `blend_strength` - Value from 0.0 to 1.0
- `color_correction` - Boolean flag
- `processing_time` - Processing duration in seconds
- `created_at` - Timestamp

**Security:** Users can only access their own face swap results.

### 4. favorite_faces
Stores user's favorite source faces for quick reuse.

**Columns:**
- `id` - Unique identifier
- `user_id` - References authenticated user
- `name` - User-defined name for the face
- `file_path` - Path to face image in storage
- `created_at` - Timestamp

**Security:** Users can manage only their own favorite faces.

## Storage Buckets

### face-swap-data
Stores all face swap related files:
- Source faces
- Target images
- Result images
- Favorite faces

**Structure:**
```
face-swap-data/
├── {user_id}/
│   ├── sources/      # Source face images
│   ├── targets/      # Target images
│   ├── results/      # Generated results
│   └── favorites/    # Saved favorite faces
```

### photos
Stores webcam photo captures.

### videos
Stores webcam video captures.

## Row Level Security (RLS)

All tables have RLS enabled to ensure:
- Users can only access their own data
- Authentication is required for all operations
- Data isolation between users
- Secure by default

## API Usage Examples

### Upload Face Swap Result

```typescript
import { uploadFaceSwapResult } from './lib/faceSwapStorage';

const result = await uploadFaceSwapResult(
  userId,
  sourceFile,
  targetFile,
  resultFile,
  0.8, // blend strength
  true, // color correction
  2.5  // processing time in seconds
);
```

### Get User's Face Swap History

```typescript
import { getFaceSwapResults } from './lib/faceSwapStorage';

const results = await getFaceSwapResults(userId);
```

### Save Favorite Face

```typescript
import { saveFavoriteSourceFace } from './lib/faceSwapStorage';

const favorite = await saveFavoriteSourceFace(
  userId,
  faceFile,
  'My Face'
);
```

### Upload Media (Photos/Videos)

```typescript
import { uploadMedia } from './lib/supabase';

const result = await uploadMedia(
  userId,
  file,
  'photo.jpg',
  'photo'
);
```

## Environment Variables

Required in `.env`:

```
VITE_SUPABASE_URL=https://goqizvxmjvbgxuvzkiom.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_k2w77q1ts6Q8As0OA1sAFQ_3hNXFANs
VITE_FACE_PROCESSING_BACKEND_URL=http://localhost:8000
```

## Authentication

The app supports authenticated users. When implementing authentication:

1. Use Supabase Auth for user management
2. All database operations automatically use `auth.uid()`
3. RLS policies enforce data access rules
4. Session management is handled automatically

## Checking Database Status

You can verify the database connection:

```typescript
import { supabase } from './lib/supabase';

// Check connection
const { data, error } = await supabase
  .from('media_items')
  .select('count');

console.log('Database connected:', !error);
```

## Storage Best Practices

1. **File Naming:** Use timestamps to prevent collisions
2. **User Folders:** Organize files by `user_id`
3. **Cleanup:** Delete storage files when deleting database records
4. **Size Limits:** Be mindful of storage quotas

## Performance Optimization

1. **Indexes:** All tables have indexes on `user_id`
2. **Cascading Deletes:** User deletion automatically cleans up data
3. **Timestamps:** All records have `created_at` for sorting
4. **Public URLs:** Use `getPublicUrl()` for file access

## Security Checklist

- ✅ Row Level Security enabled on all tables
- ✅ Policies restrict access to authenticated users
- ✅ Users can only access their own data
- ✅ Foreign keys enforce referential integrity
- ✅ Cascade deletes prevent orphaned records

## Troubleshooting

### Connection Issues

If you see connection errors:
1. Verify `.env` file has correct credentials
2. Check that Supabase project is active
3. Ensure network connectivity

### RLS Errors

If you get "new row violates row-level security" errors:
1. Verify user is authenticated
2. Check that `user_id` matches `auth.uid()`
3. Review RLS policies in Supabase dashboard

### Storage Errors

If file uploads fail:
1. Check storage bucket exists
2. Verify storage policies allow uploads
3. Ensure file size is within limits

## Migration Files

All database changes are tracked in migrations:
- `20260101024730_create_media_storage_tables.sql` - Media storage setup
- `create_face_swap_tables` - Face swap tables setup

## Next Steps

1. ✅ Database tables created
2. ✅ RLS policies configured
3. ✅ Storage helper functions ready
4. Implement user authentication (optional)
5. Create storage buckets in Supabase dashboard
6. Test file uploads and retrieval

## Supabase Dashboard

Access your project dashboard:
https://supabase.com/dashboard/project/goqizvxmjvbgxuvzkiom

From there you can:
- View tables and data
- Manage storage buckets
- Monitor API usage
- Configure authentication
- Review logs

## Support

For Supabase-specific issues:
- Documentation: https://supabase.com/docs
- Community: https://github.com/supabase/supabase/discussions
- Status: https://status.supabase.com/
