const swaggerAutogen = require("swagger-autogen")();

const doc = {
    info: {
        title: "ERP-CRM 첫 프로젝트",
        description: "Description",
    },
    host: "localhost:8888",
    schemes: ["http"],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = [
    "./app.js"
];

swaggerAutogen(outputFile, endpointsFiles, doc).then(r => console.log("생성 성공", r));
