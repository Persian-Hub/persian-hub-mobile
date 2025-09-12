// src/utils/uploadToStorage.ts
import * as FileSystem from "expo-file-system";
import { supabase } from "../lib/supabase";

/** Try fetch→blob first (works well for content://), then fall back to FileSystem base64 */
async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    return await blob.arrayBuffer();
  } catch {
    const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const bin = globalThis.atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }
}

function guessExtFromUri(uri: string) {
  const clean = uri.split("?")[0].split("#")[0].toLowerCase();
  const ext = clean.split(".").pop();
  return ext && ext.match(/^(jpg|jpeg|png|webp)$/) ? ext : "jpg";
}

function guessContentType(ext: string) {
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "application/octet-stream";
}

export async function uploadImageToStorage(opts: {
  bucket: string;           // e.g. 'business-images'
  objectPath: string;       // e.g. 'user/<uid>/<bizId>/<file>.jpg' (NO leading slash)
  uri: string;              // file:// or content://
  contentType?: string;     // optional
  upsert?: boolean;         // default false
  signedSeconds?: number;   // if set, returns signed URL; else public URL
}): Promise<string> {
  const { bucket, objectPath, uri, upsert = false, signedSeconds } = opts;

  const ext = guessExtFromUri(uri);
  const contentType = opts.contentType ?? guessContentType(ext);
  const ab = await uriToArrayBuffer(uri);

  const { error } = await supabase
    .storage
    .from(bucket)
    .upload(objectPath, ab, { contentType, upsert, cacheControl: "3600" });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  if (signedSeconds) {
    const { data, error: signErr } = await supabase
      .storage.from(bucket)
      .createSignedUrl(objectPath, signedSeconds);
    if (signErr || !data?.signedUrl) throw new Error(signErr?.message || "Failed to create signed URL");
    return data.signedUrl;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  if (!data?.publicUrl) throw new Error("No public URL returned");
  return data.publicUrl;
}
