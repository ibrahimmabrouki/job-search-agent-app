// Response returned by Hermes when reading a file through GET /api/files/read.
export type HermesFileReadResponse = {
  name: string;
  path: string;
  size: number;
  mime_type: string;
  data_url: string; // Base64-encoded file content
};

// Response returned by Hermes after writing a text file.
// Endpoint: POST /api/fs/write-text
export type HermesFileWriteResponse = {
  ok: boolean;
  path: string;
  byteSize: number;
};

/**
 * Response returned by Hermes after uploading a file.
 *
 * Endpoint: POST /api/files/upload-stream
 */
export type HermesFileUploadResponse = {
  ok: boolean;

  entry: {
    name: string;
    path: string;
    is_directory: boolean;
    size: number;
    mtime: number;
    mime_type: string;
  };

  path: string;
  root: string | null;
  locked_root: string | null;
  can_change_path: boolean;
};
