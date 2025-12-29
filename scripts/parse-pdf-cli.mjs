#!/usr/bin/env node

import fs from "node:fs/promises";
import process from "node:process";
import { PDFParse } from "pdf-parse";

async function main() {
  const [, , inputPath] = process.argv;

  if (!inputPath) {
    console.error("Usage: node scripts/parse-pdf-cli.mjs <path-to-pdf>");
    process.exit(1);
  }

  try {
    const buffer = await fs.readFile(inputPath);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy?.();

    const text = result.text || "";
    process.stdout.write(text);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
