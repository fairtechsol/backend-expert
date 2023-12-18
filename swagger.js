const swaggerAutogen = require("swagger-autogen")({ openapi: "3.0.0" });
const outputFile = "./swagger_output.json";
const fs = require("fs");

const routeFolder = ["./index.js"];
const doc = {
  info: {
    title: "betFair-expert-APIs",
    description: "bet Fair APIs Description",
    version: "1.0.0",
  },
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  servers: [
    {
      url: "http://localhost:6060",
      description: "local host url ",
    },
    {
      url: "http://development.com",
      description: "development url ",
    },
    {
      url: "https://production.com",
      description: "production url ",
    },
  ],
  basePath: "/",
  schemes: ["http", "https"],
};
console.log("Generating docs from above files..", routeFolder);
swaggerAutogen(outputFile, routeFolder, doc);
