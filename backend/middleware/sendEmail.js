const nodeMailer = require("nodemailer");

exports.sendEmail = async (options) => {
    try {
        var transporter = nodeMailer.createTransport({
            host: "smtp.mailtrap.io",
            port: 587,
            auth: {
              user: "10843b198d4488",
              pass: "66be35f78f860c"
            },
            // secure: false,
        });

        const mailOptions = {
            from: "10843b198d4488",
            to: options.email,
            subject: options.subject,
            text: options.message,
        };

        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully");
    } catch (error) {
        console.error("Error sending email:", error);
    }
};
