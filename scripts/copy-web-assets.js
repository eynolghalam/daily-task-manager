const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "www");

async function copyTree(source, destination) {
  await fs.mkdir(destination, { recursive: true });
  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) await copyTree(from, to);
    else await fs.copyFile(from, to);
  }
}

async function buildWebBundle() {
  await fs.rm(output, { recursive: true, force: true });
  await fs.mkdir(output, { recursive: true });
  for (const file of ["index.html", "app.js", "platform-bridge.js", "style.css"]) {
    await fs.copyFile(path.join(root, file), path.join(output, file));
  }
  const { version } = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
  await fs.writeFile(path.join(output, "app-version.js"), `window.APP_VERSION = ${JSON.stringify(version)};\n`);
  await copyTree(path.join(root, "assets"), path.join(output, "assets"));
}

buildWebBundle().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
