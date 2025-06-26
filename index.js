const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "msdesenvolvedor@gmail.com",
        pass: "woqm vbjc olij ncym"
    }
})

transporter.sendMail({
    from: "Micael <msdesenvolvedor@gmail.com>",
    to: "filipealves@gmail.com",
    subject: "Bem Vindo",
    html: createHtml("Micael")
}).then(data=>console.log("Enviado: ",data)).catch(err=>console.log(err))


function createHtml(name) {
    return `<html>
    <body style="
        margin: 0;
        padding: 0;
        font-family: sans-serif;
        text-align: center;
    ">
        <div style="
            padding: 100px 10px;
            font-size: 3em;
            background: #2121ab;
            color: white;
        ">
            <h1>Curso em Video</h1>
        </div>
        <div style="
            font-size: 22px;
            padding: 100px 30px;
        ">
            <h1>Bem vindo ${name}</h1>
            <p>Olha pequeno gafanhoto seja bem vindo ao curso em video</p>
        </div>
        <div style="
            padding: 50px 10px 10px 10px;
            color: #2121ab;
        ">
            <p>@micaelsilva</p>
            <p>@felipealves</p>
        </div>
</body>
</html>`
}