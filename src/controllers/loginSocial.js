import database from '../database/db.js'
import User from '../models/user.js'
import jwt from 'jsonwebtoken'
import Token from '../models/token.js'
import dotenv from 'dotenv'
dotenv.config()

/* controller login social: recebe no body nome, sobrenome, email e id do google. Busca usuario no db, caso positivo gera token. Se não existe o usuário, gera um novo cadastro deixando password como null e adicionando id do google. Após, gera um token e envia para a tabela de tokens. */

const loginSocial = async (req, res) => {
  await database.sync()
  const { sub, given_name, family_name, email, avatar } = req.body
  try {
    const user = await User.findOne({
      where: {
        email,
      },
    })

    if (!user) {
      const newUser = await User.create({
        nome: given_name,
        sobrenome: family_name,
        email,
        google_id: sub,
        avatar,
      })
      const token = jwt.sign({ id: newUser.id }, process.env.JWT_PASSWORD)
      await Token.create({
        token,
        isValid: true,
        user_id: newUser.id,
      })

      return res.status(200).json({ given_name, family_name, avatar, token })
    }

    if (!user.avatar) {
      await User.update(
        { avatar },
        {
          where: { email },
        },
      )
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_PASSWORD)
    await Token.create({
      token,
      isValid: true,
      user_id: user.id,
    })

    return res.status(200).json({ given_name, family_name, avatar, token })
  } catch (error) {
    console.error(error, 'Erro no controller de login social')
    res.status(500).json({ mensagem: 'Erro no servidor' })
  }
}

export default loginSocial
