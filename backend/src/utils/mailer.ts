import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter: nodemailer.Transporter;

const initTransporter = async () => {
    if (transporter) return transporter;

    if (process.env.SMTP_USER === 'ethereal_user') {
        console.log('Generating temporary Ethereal account for testing...');
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log('Using generated Ethereal test account:', testAccount.user);
    } else {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return transporter;
};

/**
 * Sends an email
 * @param to Recipient email address
 * @param subject Email subject
 * @param html Email body in HTML format
 */
export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
    try {
        const tp = await initTransporter();

        const info = await tp.sendMail({
            from: `"LMS Antigravity" <${process.env.SMTP_USER === 'ethereal_user' ? 'test@ethereal.email' : process.env.SMTP_USER}>`, // sender address
            to, // list of receivers
            subject, // Subject line
            html, // html body
        });

        console.log('Message sent: %s', info.messageId);

        // Output Ethereal URL if using Ethereal email for testing
        if (process.env.SMTP_USER === 'ethereal_user') {
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
    } catch (error) {
        console.error('Error sending email:', error);
    }
};
