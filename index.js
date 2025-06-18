const { PrismaClient } = require("./src/generated/prisma")

const client = new PrismaClient()

console.log("Testing")

client.course.findMany().then(data=>{console.log(data)})