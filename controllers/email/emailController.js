import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const emailSender = async (req,res) =>{
  const {
    features,
    companyName,
    studentCount,
    name,
    surName,
    email,
    phone,
    contactTime,
  } = req.body;
  try {
    console.log(req.body)
    const mainEmail = process.env.EMAIL;
    const password = process.env.PASS;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: mainEmail,
        pass: password,
      },
    });

    const mailOptions = {
      from: mainEmail,
      to: "samedovrasul7@gmail.com",
      subject: " from Edinify ",
      html:  `<ul>
          <p> İstənilən xüsusiyyətlər. </p>
          <li>   ${ features.map((data) =>  `${data} /`) } </li>
          <p> Şirkət haqqında </p>
          <li> <b> Şirkət adı: </b>  ${companyName} </li>
          <li> <b> Tələbə sayı: </b>  ${studentCount} </li>
          <p> Əlaqə məlumatı </p>
          <li> <b> Ad: </b>  ${name} </li>
          <li> <b> Soyad: </b>  ${surName} </li>
          <li> <b> Email: </b>  ${email} </li>
          <li> <b> Telefon: </b>  ${phone} </li>
          <li> <b> Əlaqə zamanları: </b>  ${ contactTime.map((data) =>  `${data} /`) } </li>
        </ul>`
      ,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ error: error });
      } else {
        res.status(200).json({ message: "Code sent successfuly" });
      }
    });

  } catch (error) {
    console.log(error)
  }
}