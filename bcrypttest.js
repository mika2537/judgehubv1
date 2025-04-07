// When creating a user:
import bcrypt from 'bcrypt';

const hashedPassword = await bcrypt.hash(password, 10);
await Users.create({ email, name, password: hashedPassword });