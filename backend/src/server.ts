import Fastify from "fastify";

const app = Fastify();

app.get("/health", async () => {
  return { status: "ok" };
});

try {
  await app.listen({ port: 3000 });
  console.log("Lyssna på http://localhost:3000");
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
