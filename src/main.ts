import { program } from "commander";
import { logger } from "./lib/logger.js";

const p = program
  .name("colabpirate")
  .version("v0.1")
  .description("putting and end to piracy");

p.command("dl <url>").action((url) => {
  logger.info("url is", url);
});

p.parse(process.argv);
