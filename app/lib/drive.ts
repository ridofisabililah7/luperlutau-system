import { google } from "googleapis";
import path from "path";
import fs from "fs";

// Mengambil kredensial dari root project
const KEY_PATH = path.join(process.cwd(), "google-credentials.json");
const SCOPES = ["https://www.googleapis.com/auth/drive"];

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_PATH,
  scopes: SCOPES,
});

const drive = google.drive({ version: "v3", auth });

// ID Folder Root yang kamu berikan
const ROOT_FOLDER_ID = "1dJHdSt4r6tX5OYFbZ3DzXVKqrugfwic3";

/**
 * Upload file Markdown hasil eksekusi agen yang di-approve CEO R ke Google Drive
 */
export async function uploadMarkdownToDrive(title: string, content: string) {
  try {
    const fileMetadata = {
      name: `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}_${Date.now()}.md`,
      parents: [ROOT_FOLDER_ID],
    };

    const media = {
      mimeType: "text/markdown",
      body: content,
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, name, webViewLink",
    });

    return file.data;
  } catch (error) {
    console.error("Gagal upload ke Google Drive:", error);
    return null;
  }
}

/**
 * Membaca semua dokumen dari folder Google Drive untuk kebutuhan RAG
 */
export async function listKnowledgeFiles() {
  try {
    const res = await drive.files.list({
      q: `'${ROOT_FOLDER_ID}' in parents and trashed = false`,
      fields: "files(id, name, mimeType)",
    });
    return res.data.files || [];
  } catch (error) {
    console.error("Gagal membaca folder Google Drive:", error);
    return [];
  }
}

/**
 * Mengambil teks dari file tertentu di Drive
 */
export async function getFileContent(fileId: string) {
  try {
    const res = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "text" }
    );
    return res.data as string;
  } catch (error) {
    console.error("Gagal mengunduh isi file:", error);
    return "";
  }
}