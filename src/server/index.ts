import { PrismaClient } from "../generated/prisma";
import express from "express";
import cors from "cors"

const prisma = new PrismaClient()
const app = express()

//usando cors
app.use(cors())

//buscar todos os cursos
app.get("/courses", async (req, res)=>{
    const courses = await prisma.course.findMany()
    res.json(courses)
})

//buscar todos os videos de um curso
app.get("/videos/:courseslug", async (req, res)=>{
    const courseslug = req.params.courseslug

    const courseid = (await prisma.course.findUnique({where: {slug: courseslug}}))?.id

    const videos = await prisma.video.findMany({
        where: {course: courseid}, 
        select: {slug: true, title: true, image: true, description: true, order: true}
    })

    res.json(videos)
})

//buscar um video unico
app.get("/video/:videoslug", async (req, res)=>{
    const videoslug = req.params.videoslug
    const video = await prisma.video.findUnique({
        where: {slug: videoslug},
        select: {title: true, video: true, description: true, order: true}
    })

    res.json(video)
})

const PORT = process.env.PORT != undefined ? process.env.PORT : 8081

app.listen(PORT, ()=>console.log("rodando na porta", PORT))