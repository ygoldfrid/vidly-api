const request = require("supertest");
const { Genre } = require("../../models/genre");
const { User } = require("../../models/user");
const mongoose = require("mongoose");

let server;

describe("/api/genres", () => {
  beforeEach(() => (server = require("../../index")));
  afterEach(async () => {
    await Genre.remove({});
    await server.close();
  });

  describe("GET /", () => {
    it("should return all genres", async () => {
      const genres = [{ name: "genre1" }, { name: "genre2" }];
      await Genre.collection.insertMany(genres);
      const res = await request(server).get("/api/genres");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some((g) => g.name === "genre1")).toBeTruthy();
      expect(res.body.some((g) => g.name === "genre2")).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    // 1. Define the happy path
    // 2. In each test we change 1 parameter that aligns with the name of the test
    let genre;
    let id;

    const exec = () => {
      return request(server).get(`/api/genres/${id}`);
    };

    beforeEach(async () => {
      genre = new Genre({ name: "genre1" });
      await genre.save();
      id = genre._id;
    });

    it("should return 404 if ID is invalid", async () => {
      id = 1;
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return 404 if ID is valid but genre does not exist", async () => {
      id = mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return the genre if it is valid", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id", genre._id.toHexString());
      expect(res.body).toHaveProperty("name", genre.name);
    });
  });

  describe("POST /", () => {
    // 1. Define the happy path
    // 2. In each test we change 1 parameter that aligns with the name of the test
    let token;
    let name;

    const exec = () => {
      return request(server)
        .post("/api/genres")
        .set("x-auth-token", token)
        .send({ name });
    };

    beforeEach(() => {
      token = new User().generateAuthToken();
      name = "genre1";
    });

    it("should return 401 if user is not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 400 if genre name is shorter than 3 characters", async () => {
      name = "ge";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if genre name is longer than 50 characters", async () => {
      name = new Array(52).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should save the genre if it is valid", async () => {
      await exec();
      const genre = await Genre.find({ name: "genre1" });
      expect(genre).not.toBeNull();
    });

    it("should return the new genre", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("name", "genre1");
    });
  });

  describe("PUT /:id", () => {
    // 1. Define the happy path
    // 2. In each test we change 1 parameter that aligns with the name of the test
    let token;
    let newName;
    let genre;
    let id;

    const exec = () => {
      return request(server)
        .put(`/api/genres/${id}`)
        .set("x-auth-token", token)
        .send({ name: newName });
    };

    beforeEach(async () => {
      genre = new Genre({ name: "genre1" });
      await genre.save();
      id = genre._id;
      token = new User().generateAuthToken();
      newName = "updatedName";
    });

    it("should return 401 if user is not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 404 if ID is invalid", async () => {
      id = 1;
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return 404 if ID is valid but genre does not exist", async () => {
      id = mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return 400 if genre name is shorter than 3 characters", async () => {
      newName = "ge";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if genre name is longer than 50 characters", async () => {
      newName = new Array(52).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should update the genre if it is valid", async () => {
      await exec();
      const updatedGenre = await Genre.findById(id);
      expect(updatedGenre.name).toBe(newName);
    });

    it("should return the updated genre", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id", genre._id.toHexString());
      expect(res.body).toHaveProperty("name", newName);
    });
  });

  describe("DELETE /:id", () => {
    // 1. Define the happy path
    // 2. In each test we change 1 parameter that aligns with the name of the test
    let token;
    let genre;
    let id;

    const exec = () => {
      return request(server)
        .delete(`/api/genres/${id}`)
        .set("x-auth-token", token)
        .send();
    };

    beforeEach(async () => {
      genre = new Genre({ name: "genre1" });
      await genre.save();
      id = genre._id;
      token = new User({ isAdmin: true }).generateAuthToken();
    });

    it("should return 401 if user is not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 403 if user is not admin", async () => {
      token = new User({ isAdmin: false }).generateAuthToken();
      const res = await exec();
      expect(res.status).toBe(403);
    });

    it("should return 404 if ID is invalid", async () => {
      id = 1;
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return 404 if ID is valid but genre does not exist", async () => {
      id = mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should delete the genre if it is valid", async () => {
      await exec();
      const genreInDb = await Genre.findById(id);
      expect(genreInDb).toBeNull();
    });

    it("should return the deleted genre", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id", genre._id.toHexString());
      expect(res.body).toHaveProperty("name", genre.name);
    });
  });
});
