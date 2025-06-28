import { PrismaClient } from "../generated/prisma";
import {sign, verify} from "jsonwebtoken"
import {OAuth2Client} from "google-auth-library"
import express from "express";
import cors from "cors"

import { createHash, compareHash } from "../encrypted";
import { sendMail } from "../email"

const prisma = new PrismaClient()
const client = new OAuth2Client("593215396622-f6615g28imqq6m9c4943rvg5e11nmv6q.apps.googleusercontent.com")
const app = express()

const secret = "2544b58cbb102f21" //segredo pro token

//usando cors
app.use(cors())

//usando express.json
app.use(express.json())

//Rotas get
    //rota principal
    app.get("/", async (req, res)=>{
        res.sendFile(__dirname + "/index.html")
    })

    //buscar todos os cursos
    app.get("/courses", async (req, res)=>{
        const courses = await prisma.course.findMany()
        res.json(courses)
    })

    //buscar todos os cursos
    app.get("/course/:courseslug", async (req, res)=>{
        const courseslug = req.params.courseslug
        const course = await prisma.course.findUnique({
            where: {slug: courseslug}
        })
        res.json(course)
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

//Rotas Post

    //Registrar usuario
    app.post("/user/register", async (req, res)=>{
        const password = req.body.password
        const name = req.body.name
        const email = req.body.email
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        //verificando dados
        if((name == undefined && typeof name != "string") || (password == undefined && typeof password != "string") || (email == undefined && typeof email != "string")){
            res.json({error: "body data incomplete or incorrect", message: "Dados incorretos ou incopletos"})
            return
        }

        //validando email
        if(!emailRegex.test(email)){
            res.json({error: "invalid email", message: "Email possiui formato inválido"})
            return
        }

        //buscar se o email já está registrado
        const isregiter = await prisma.user.findUnique({where: {email: email}})

        if(isregiter != null && isregiter != undefined){
            res.json({error: "duplicate email", message: "Email já cadastrado"})
            return
        }

        const hash = await createHash(password)

        try {
            const register = await prisma.user.create({
                data: {
                    name: name,
                    email: email,
                    password: hash,
                    provider: ["root"]
                }
            })
    
            //tentando enviar o email
            try{
                await sendMail("register",email,name)
            }catch(err){
                console.log("Email error: ",err)
            }
    
            res.json({success: "registered", message: "Usuário cadastrado com sucesso."})
        } catch (error) {
            console.log(error)
            res.json({error: error, message: "Erro ao registrar usuário"})
        }

    })

    //Login
    app.post("/user/login", async (req, res)=>{
        const email = req.body.email
        const password = req.body.password
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

         //verificando dados
        if((password == undefined && typeof password != "string") || (email == undefined && typeof email != "string")){
            res.json({error: "body data incomplete or incorrect", message: "Dados incorretos ou incopletos"})
            return
        }

        //validando email
        if(!emailRegex.test(email)){
            res.json({error: "invalid email", message: "Email possiui formato inválido"})
            return
        }

        //buscando dados
        const user = await prisma.user.findUnique({where: {email: email}})

        if((user == null || user == undefined)){
            res.json({error: "dont registered", message: "Email não registrado"})
            return
        }

        if(!user.provider.includes("root")){
            res.json({error: "dont has provider root", message: "Email não possui registro padrão"})
            return
        }
        
        if(await compareHash(password, user.password)){
            const token = sign({id: user.id, name: user.name, email: user.email}, secret, {expiresIn: "7d"})
            res.json({success: "successful login", message: "Login bem sucedido", token: token})
        }else{
            res.json({error: "falied login", message: "Senha incorreta"})
        }

    })

    //login com o google
    app.post("/user/login/google", async (req, res)=>{
        const {googletoken} = req.body
        let payload
        let success: string = "google login successful"
        let message: string = "Login com o google bem sucedido"

        //verificando o tipo do token recebido
        if(typeof googletoken != "string"){
            res.json({error: "Invalid Token", message: "Token inválido"})
            return
        }

        //verificando token
        try {
            const ticket = await client.verifyIdToken({
                idToken: googletoken, 
                audience: "593215396622-f6615g28imqq6m9c4943rvg5e11nmv6q.apps.googleusercontent.com"
            })

            payload = ticket.getPayload()
        } catch (error) {
            console.log(error)
            res.json({error: "invalid token signature", message: "Assinatura de token inválida"})
            return
        }
        
        //Caso o email não seja verificado
        if(!payload?.email_verified){
            res.json({error: "email not verified", message: "Email não verificado"})
            return
        }

        //buscando email no banco de dados
        let register = await prisma.user.findUnique({where: {email: payload.email}})

        //Caso necessite salvar no dados
        if((payload.email && payload.name) && !register){ 
            try {
                const add = await prisma.user.create({
                    data: {
                        email: payload.email,
                        name: payload.name,
                        password: "",
                        provider: ["google"]
                    }
                })
                
                register = add
                success = "google-created account"
                message = "Conta criada com o Google"

                //tentando enviar o email
                try{
                    await sendMail("register",add.email, add.name)
                }catch(err){
                    console.log("Email error: ",err)
                }
            } catch (error) {
                console.log(error)
                res.json({error: error, message: "Erro ao registrar usuário"})
            }
        }
        
        //Caso necessite adicionar novo provedor
        if(payload.email && register && !register?.provider.includes("google")){ 
            register?.provider.push("google")
            
            try{
                const upp = await prisma.user.update({
                    where: {email: payload.email}, 
                    data: {provider: register?.provider}
                })
                success = "provider added"
                message = "Provedor adicionado"
            }catch (err){
                console.log(err)
                res.json({error: err, message: "provedor não adicionado"})
            }
        }

        //gerando token e enviado respostas de sucessos
        const token = sign({id: register?.id, email: register?.email, name: register?.name}, secret, {expiresIn: "7d"})
        res.json({success: success, message: message, token: token})
    })

    //validar token
    app.post("/user/validate/token", (req, res)=>{
        const token = req.body.token

         //verificando dados
        if((token == undefined && typeof token != "string")){
            res.json({error: "token not provided", message: "Token não informado"})
            return
        }

        try {
            const decoded = verify(token, secret)
            res.json({valid: true, success: "valid token", message: "Token válido", decoded: decoded})
        } catch (error) {
            res.json({valid: false, error: "invalid token", message: "Token inválido"})
        }

    })

const PORT = process.env.PORT != undefined ? process.env.PORT : 8081

app.listen(PORT, ()=>console.log("rodando na porta", PORT))