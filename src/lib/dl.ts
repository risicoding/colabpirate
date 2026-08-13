import fs from "node:fs";
import http, { IncomingMessage } from "node:http";
import https from "node:https";
import path from "node:path";
import { URL } from "node:url";
import cliProgress from "cli-progress";
import { logger } from "./logger.js";
import { createSingleBar } from "./progress.js";
import { formatBytes } from "./fs.js";

const getFilename = (res: IncomingMessage, url: string): string => {
  const disposition = res.headers["content-disposition"];

  if (disposition) {
    const utf8 = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
    if (utf8) return decodeURIComponent(utf8[1]!);

    const normal = disposition.match(/filename="?([^"]+)"?/i);
    if (normal) return normal[1]!;
  }

  const name = path.basename(new URL(url).pathname) || "download";
  return name.slice(0, 10);
};

export const request = (
  url: string,
  range: number = 0,
  filename: string | null = null,
  dir = "download",
): void => {
  fs.mkdirSync(dir, { recursive: true });
  const client = url.startsWith("https") ? https : http;

  const headers: Record<string, string> = {};

  if (range > 0) {
    headers.Range = `bytes=${range}-`;
  }

  client.get(url, { headers }, (res: IncomingMessage) => {
    if (
      [301, 302, 303, 307, 308].includes(res.statusCode ?? 0) &&
      res.headers.location
    ) {
      const next = new URL(res.headers.location, url).toString();
      return request(next);
    }

    if (!filename) {
      filename = getFilename(res, url);
      const filePath = path.join(dir, filename);
      range = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;

      if (range > 0 && !headers.Range) {
        return request(url, range, filename, dir);
      }
    }
    const filePath = path.join(dir, filename!);

    if (![200, 206].includes(res.statusCode ?? 0)) {
      logger.error(`HTTP ${res.statusCode}`);
      process.exit(1);
    }

    if (res.statusCode === 200 && range > 0) {
      logger.info("Server doesn't support resume. Restarting...");
      fs.truncateSync(filePath, 0);
      range = 0;
    }

    const total = Number(res.headers["content-length"] ?? 0) + range;

    const file = fs.createWriteStream(filePath, {
      flags: range > 0 ? "a" : "w",
    });

    const bar = createSingleBar();
    let downloaded = range;
    let lastBytes = downloaded;
    let lastTime = Date.now();

    bar.start(total, downloaded, { speed: "0.00" });

    res.on("data", (chunk: Buffer) => {
      file.write(chunk);
      downloaded += chunk.length;

      const now = Date.now();
      const dt = (now - lastTime) / 1000;

      if (dt >= 0.5) {
        const speed = formatBytes((downloaded - lastBytes) / dt);

        bar.update(downloaded, { speed });

        lastBytes = downloaded;
        lastTime = now;
      }
    });

    res.on("end", () => {
      file.close();
      bar.update(total);
      bar.stop();
      logger.info(`Saved as ${filename!}`);
    });

    res.on("error", (err: Error) => {
      file.close();
      bar.stop();
      logger.error(err);
    });
  });
};

const url = "http://localhost:5000/dl/1";

request(url);
