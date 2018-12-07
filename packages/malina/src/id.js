const base58 = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'

export const genRandomId = length => {
  let result = ''
  for (let i = 0; i < length; i++)
    result += base58[Math.round(Math.random() * (base58.length - 1))]

  return result
}
