import { agent } from "supertest";
import { newApp } from "../src/app";
import { DataSource } from "typeorm";
import { entities } from "../src/infra/db";

const dataSource = new DataSource({
  type: "sqlite",
  database: ":memory:",
  entities,
  logging: true,
  synchronize: true,
});

const app = newApp(undefined, dataSource);
const server = app.listen(Math.floor(Math.random() * 10000));
const request = agent(app);

describe("api", () => {
  after(() => {
    server.close();
  });

  it("/.well-known/nodeinfo", async (done) => {
    await request.get("/.well-known/nodeinfo").expect(200).expect("{}", done);
  });
});
