
const jwt = require("jsonwebtoken");

function autenticarToken(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Token não informado",
    });
  }

  const token = authorization.slice(7);

  try {
    const dados = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    req.admin = dados;

    next();
  } catch (erro) {
    return res.status(401).json({
      message: "Token inválido ou expirado",
    });
  }
}

module.exports = autenticarToken;
