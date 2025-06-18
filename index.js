const { PrismaClient } = require("@prisma/client")
const {readFile} = require("fs")

const client = new PrismaClient()

readFile("videos.json", "utf-8",(err, file)=>{
    const data = JSON.parse(file)
    const videos = data.map(e=>{return {slug: e.slug, title: e.title, video: e.video, description: e.description, image: e.image, order: e.order, course: e.course}})

    client.video.createMany({data: videos}).then(()=>console.log("Registrados todos os videos"))
})