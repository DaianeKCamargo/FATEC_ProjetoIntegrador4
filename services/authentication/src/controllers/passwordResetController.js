
const model = require("../models/passwordResetModel");

const RESET_PASS_EMAIL_SERVICE_URL = (
  process.env.PASSWORD_RESET_EMAIL_SERVICE_URL ||
  "http://localhost:5509"
).replace(/\/$/, "");

async function enviarTokenRecuperacaoPorEmail({ emailUser, resetToken }) {
  const resposta = await fetch(
    `${RESET_PASS_EMAIL_SERVICE_URL}/api/reset-pass-email/send-token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: emailUser,
        token: resetToken,
        expiresInMinutes: 60,
        subject: "Token de recuperação de senha - TamPets",
      }),
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!resposta.ok) {
    throw new Error("Falha no envio do e-mail");
  }
}

// Solicitar recuperação de senha
async function solicitarRecuperacao(req, res) {
  try {
    const { emailUser } = req.body || {};

    if (
      typeof emailUser !== "string" ||
      !emailUser.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailUser.trim())
    ) {
      return res.status(400).json({
        message: "Informe um e-mail válido",
      });
    }

    const email = emailUser.trim().toLowerCase();

    try {
      const resetToken = await model.gerarTokenRecuperacao(email);

      try {
        await enviarTokenRecuperacaoPorEmail({
          emailUser: email,
          resetToken,
        });
      } catch (erroEmail) {
        await model.limparTokenRecuperacao(email);

        throw erroEmail;
      }
    } catch (erro) {
      if (erro.message === "Email não encontrado") {
        // Não revelar se o e-mail está cadastrado
        return res.status(200).json({
          message:
            "Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.",
        });
      }

      console.error("Erro ao solicitar recuperação:", erro.message);

      return res.status(502).json({
        message:
          "Não foi possível enviar o e-mail de recuperação. Tente novamente mais tarde.",
      });
    }

    return res.status(200).json({
      message:
        "Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.",
    });
  } catch (erro) {
    console.error("Erro na solicitação de recuperação:", erro.message);

    return res.status(500).json({
      message: "Erro interno ao solicitar recuperação de senha",
    });
  }
}

// Validar token de recuperação
async function validarToken(req, res) {
  try {
    const { emailUser, resetToken } = req.body || {};

    if (
      typeof emailUser !== "string" ||
      typeof resetToken !== "string" ||
      !emailUser.trim() ||
      !resetToken.trim()
    ) {
      return res.status(400).json({
        message: "E-mail e token são obrigatórios",
      });
    }

    await model.validarTokenRecuperacao(
      emailUser.trim().toLowerCase(),
      resetToken.trim()
    );

    return res.status(200).json({
      message: "Token válido",
    });
  } catch (erro) {
    return res.status(400).json({
      message: "Token inválido ou expirado",
    });
  }
}

// Redefinir senha
async function redefinirSenha(req, res) {
  try {
    const { emailUser, resetToken, novaSenha } = req.body || {};

    if (
      typeof emailUser !== "string" ||
      typeof resetToken !== "string" ||
      typeof novaSenha !== "string" ||
      !emailUser.trim() ||
      !resetToken.trim() ||
      !novaSenha
    ) {
      return res.status(400).json({
        message: "E-mail, token e nova senha são obrigatórios",
      });
    }

    if (novaSenha.length < 8) {
      return res.status(400).json({
        message: "A senha deve possuir pelo menos 8 caracteres",
      });
    }

    await model.redefinirSenha(
      emailUser.trim().toLowerCase(),
      resetToken.trim(),
      novaSenha
    );

    return res.status(200).json({
      message: "Senha redefinida com sucesso",
    });
  } catch (erro) {
    console.error("Erro ao redefinir senha:", erro.message);

    return res.status(400).json({
      message: "Não foi possível redefinir a senha. Verifique o token e tente novamente.",
    });
  }
}

module.exports = {
  solicitarRecuperacao,
  validarToken,
  redefinirSenha,
};
