import { buildApp } from "./app.js";

const app = await buildApp();

try {
  await app.listen({ port: 3000 });
  console.log("Lyssnar på http://localhost:3000");
} catch (err) {
  app.log.error(err);
  process.exit(1);
}