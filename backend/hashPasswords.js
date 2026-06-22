require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function hashAllPasswords() {
  const users = await User.findAll();

  for (const user of users) {
    // Évite de re-hasher un mot de passe déjà hashé (commence par $2)
    if (user.password.startsWith('$2')) {
      console.log(`⏭️  ${user.username} déjà hashé`);
      continue;
    }

    const hashed = await bcrypt.hash(user.password, 10);
    user.password = hashed;
    await user.save();
    console.log(`✅ ${user.username} → mot de passe hashé`);
  }

  console.log('\n🏁 Tous les mots de passe ont été traités !');
  process.exit();
}

hashAllPasswords().catch(e => {
  console.error(e);
  process.exit(1);
});