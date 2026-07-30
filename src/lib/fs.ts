import { Result, ResultAsync } from "neverthrow";
import { createReadStream, statSync } from "fs";
import { AppError } from "./error.js";
import pathm from "path";
import fs from "fs/promises";

class FilesystemError extends AppError {}

export const safeMkdir = ResultAsync.fromThrowable(
  fs.mkdir,
  (e) => new FilesystemError("error creating directory", e),
);
export const safeWriteFile = ResultAsync.fromThrowable(
  fs.writeFile,
  (e) => new FilesystemError("error writing file", e),
);
export const safeReadFile = ResultAsync.fromThrowable(
  fs.readFile,
  (e) => new FilesystemError("error reading file", e),
);

export const safeOpen = ResultAsync.fromThrowable(
  fs.open,
  (e) => new FilesystemError("error opening file", e),
);

export const getFileStream = Result.fromThrowable(
  createReadStream,
  (e) => new FilesystemError("cant read file", e),
);

export const getFileStat = Result.fromThrowable(
  statSync,
  (e) => new FilesystemError("cant read file", e),
);

export const getFileData = (path: string) =>
  getFileStat(path)
    .map((t) => {
      const size = Number(t?.size);
      const name = pathm.basename(path);

      return { name, size, filePath: path };
    })
    .mapErr(
      (e) =>
        new FilesystemError(
          e.message ?? "" + pathm.basename(path),
          e.error,
          e.meta,
        ),
    );

export const formatBytes = (bytes: number) => {
  const KB = bytes / 1024;
  if (KB < 0) return bytes + "B";
  if (KB >= 1024) {
    const MB = KB / 1024;
    if (MB >= 1024) {
      const GB = MB / 1024;
      return GB.toFixed(3) + "GB";
    } else return MB.toFixed(3) + "MB";
  } else {
    return KB.toFixed(3) + "KB";
  }
};
