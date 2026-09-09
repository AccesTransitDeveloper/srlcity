import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "..", ".env"),
  path.resolve(__dirname, "..", "..", "..", ".env"),
];

for (const envPath of envPaths) {
  try {
    process.loadEnvFile?.(envPath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      throw error;
    }
  }
}

(async () => {
  const { default: app } = await import("./app");

  const rawPort = process.env["PORT"];

  if (!rawPort) {
    throw new Error(
      "PORT environment variable is required but was not provided.",
    );
  }

  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
})().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
