import * as nodemailer from "nodemailer";

export const sendActiveUserEmail = async (email: string, token: string) => {
  const transporter = nodemailer.createTransport({
    // Configure your email service
    service: "gmail", // Example using Gmail
    auth: {
      user: Bun.env.Email,
      pass: Bun.env.EmailPass,
    },
  });

  const resetLink = `http://localhost:3000/auth/activation?token=${token}`;

  await transporter.sendMail({
    from: "mrsajjadcode@gmail.com",
    to: email,
    subject: "فعالسازی اکانت در bugboard",
    text: `شما می توانید با این لینک اکانت خود را فعال کنید: ${resetLink}`,
  });
};

export const sendPasswordResetCodeEmail = async (
  email: string,
  code: number
) => {
  const transporter = nodemailer.createTransport({
    // Configure your email service
    service: "gmail", // Example using Gmail
    auth: {
      user: Bun.env.Email,
      pass: Bun.env.EmailPass,
    },
  });

  await transporter.sendMail({
    from: "mrsajjadcode@gmail.com",
    to: email,
    subject: "بازیابی رمز عبور - از این کد استفاده کنید",
    text: `You can Reset your password with using this code  : ${code}`,
  });
};
