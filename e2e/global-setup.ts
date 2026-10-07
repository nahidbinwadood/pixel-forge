import { execSync } from "node:child_process";

// Auth rate limits are per IP; every E2E run comes from 127.0.0.1, so start each run with empty buckets.
// SQL goes over stdin to stay shell-agnostic (cmd.exe mangles nested quotes).
export default function globalSetup() {
  execSync("docker compose exec -T postgres psql -U pixelforge", {
    input: 'DELETE FROM "RateLimit";',
    stdio: ["pipe", "ignore", "inherit"],
  });
}
