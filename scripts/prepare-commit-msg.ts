import fs from 'fs'

const commitMsgPath = process.argv[2]
if (!commitMsgPath) process.exit(0)

const emojiString = '✨🚀🐛🔥🎨⚡📝🔒♻️🐳🛠️📦🧪🚨🧹'

const currentMessage = fs.readFileSync(commitMsgPath, 'utf8')

const emojis = Array.from(emojiString)
const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
const newMessage = `${randomEmoji} ${currentMessage}`

fs.writeFileSync(commitMsgPath, newMessage)
