import winston, { createLogger, format, transports } from "winston";
const { combine, timestamp, printf } = format;
const myFormat = printf(({ level, message, label, timestamp, ...meta }) => {
  return `${timestamp}${label ? ` ${label}` : ""} [${level}]: ${typeof message === "object" ? `\n${JSON.stringify(message, null, 2)}` : message}${Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : ""}`;
});
export const logger = createLogger({
  format: combine(
    format.colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    myFormat,
    winston.format.metadata(),
  ),
  transports: [
    new transports.Console({
      level: process.env.NODE_ENV !== "production" ? "debug" : "info",
    }),
    new transports.File({ filename: ".logs/error.log", level: "error" }),
    new transports.File({ filename: ".logs/combined.log" }),
    new transports.File({ filename: ".logs/debug.log" }),
  ],
});
