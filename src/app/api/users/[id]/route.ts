import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || Array.isArray(id)) {
    res.status(400).json({ error: 'Invalid ID' })
    return
  }

  if (req.method === 'GET') {
    const user = await prisma.user.findUnique({ where: { id: Number(id) } })
    if (user) res.status(200).json(user)
    else res.status(404).json({ error: 'User not found' })
  } else if (req.method === 'PUT') {
    const { name, email, password } = req.body
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { name, email, password },
    })
    res.status(200).json(updatedUser)
  } else if (req.method === 'DELETE') {
    await prisma.user.delete({ where: { id: Number(id) } })
    res.status(204).end()
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}