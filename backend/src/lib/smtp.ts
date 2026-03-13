import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Configuração do SMTP
const smtpConfig: any = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true" || false,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
};

// Configurar TLS para aceitar certificados autoassinados
// Em produção, se o servidor SMTP usar certificado autoassinado,
// defina SMTP_ALLOW_SELF_SIGNED=true nas variáveis de ambiente
const allowSelfSigned = 
  process.env.SMTP_ALLOW_SELF_SIGNED === "true" || 
  process.env.SMTP_ALLOW_SELF_SIGNED === "1" ||
  process.env.NODE_ENV === "development";

if (allowSelfSigned) {
  smtpConfig.tls = {
    rejectUnauthorized: false,
  };
  console.log("SMTP: Aceitando certificados autoassinados (SMTP_ALLOW_SELF_SIGNED=true)");
}

// Criar transporter
export const transporter = nodemailer.createTransporter(smtpConfig);

// Verificar conexão SMTP
export async function verifySMTP(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error("SMTP verification failed:", error);
    return false;
  }
}

// Enviar email
export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const fromName = process.env.SMTP_FROM_NAME || "BSN Solution";
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@bsnsolution.com.br";

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""), // Remove HTML tags para texto
      replyTo: options.replyTo || fromEmail,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return true;
  } catch (error: any) {
    console.error("Error sending email:", error);
    
    // Se o erro for de certificado autoassinado, sugerir a solução
    if (error.code === "ESOCKET" && error.message?.includes("self-signed certificate")) {
      console.error("SMTP Error: Certificado autoassinado detectado.");
      console.error("Solução: Defina SMTP_ALLOW_SELF_SIGNED=true nas variáveis de ambiente.");
    }
    
    return false;
  }
}

export default transporter;