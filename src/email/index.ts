import nodemailer from "nodemailer"
import {readFileSync} from "fs"

type Type = "register" | "reset-password"

const auth = {
    user: "msdesenvolvedor@gmail.com",
    pass: "woqm vbjc olij ncym" //woqm vbjc olij ncym
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: auth
})

export async function sendMail(type:Type, email:string, name: string) {
    const info = transporter.sendMail({
        from: "Clone Curso em Video <msdesenvolvedor@gmail.com>",
        to: email,
        subject: "Bem Vindo",
        html: createHtml(type, email, name)
    })
    return info
}

function createHtml(type: Type, email: string,name:string) {
    switch (type) {
        case "register":
            return readFileSync(__dirname+"/tamplates-emails/register.html")
            .toString("utf-8")
            .replace("{{name}}", name)
            .replace("{{email}}", email)
    
        case "reset-password":
            return readFileSync(__dirname+"/tamplates-emails/reset-password.html")
            .toString("utf-8")
            .replace("{{name}}", name)
            .replace("{{email}}", email)
    
        default:
            break;
    }
    
}
