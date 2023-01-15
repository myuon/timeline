import supertest from "supertest";
import { newApp } from "../src/app";
import { DataSource } from "typeorm";
import { entities } from "../src/infra/db";
import { domain } from "../src/config";

const dataSource = new DataSource({
  type: "sqlite",
  database: ":memory:",
  entities,
  logging: true,
  synchronize: true,
});

const app = newApp(undefined, dataSource);
const server = app.listen(Math.floor(Math.random() * 10000));
const request = supertest(server);

describe("api", () => {
  before(async () => {
    await dataSource.initialize();
    await request.get("/manifest.json");
  });

  after(async () => {
    server.close();
    await dataSource.destroy();
  });

  it("/.well-known/nodeinfo", async () => {
    await request
      .get("/.well-known/nodeinfo")
      .timeout(10000)
      .expect(200, {
        links: [
          {
            rel: "http://nodeinfo.diaspora.software/ns/schema/2.1",
            href: `https://${domain}/nodeinfo/2.1`,
          },
        ],
      });
  });
});
