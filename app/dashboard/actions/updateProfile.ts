'use server'

import fs from "fs";
import path from "path";
import { promises as fsPromises } from "fs";

const CONFIG_PATH = path.join(process.cwd(), "userConfig.json");
const AVATAR_DIR = path.join(process.cwd(), "public/userAvatars");

if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });

export async function updateProfile({ name, file }: UpdateProfileParams): Promise<ProfileResponse> {
  try {
    let config: { name: string; avatar: string } = { name: "My Wallet", avatar: "/icon/gallery_edit.svg" };
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = await fsPromises.readFile(CONFIG_PATH, "utf-8");
      config = JSON.parse(raw);
    }

    if (name) config.name = name;

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop() || "png";
      const fileName = `avatar_${Date.now()}.${ext}`;
      const filePath = path.join(AVATAR_DIR, fileName);
      await fsPromises.writeFile(filePath, buffer);

      config.avatar = `/userAvatars/${fileName}`;
    }

    await fsPromises.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));

    return { success: true, config };
  } catch (err: any) {
    console.error("updateProfile error:", err);
    return { success: false, config: { name: "My Wallet", avatar: "/icon/gallery_edit.svg" } };
  }
}

export async function getProfile(): Promise<ProfileResponse> {
  try {
    let config: { name: string; avatar: string } = { name: "My Wallet", avatar: "/icon/gallery_edit.svg" };
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = await fsPromises.readFile(CONFIG_PATH, "utf-8");
      config = JSON.parse(raw);
    }
    return { success: true, config };
  } catch (err: any) {
    console.error("getProfile error:", err);
    return { success: false, config: { name: "My Wallet", avatar: "/icon/gallery_edit.svg" } };
  }
}
