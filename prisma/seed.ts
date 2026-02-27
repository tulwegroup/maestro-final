import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')
  
  // Create admin user
  const adminPasswordHash = await bcrypt.hash('Admin123!', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@maestropay.ae' },
    update: {},
    create: {
      email: 'admin@maestropay.ae',
      name: 'Admin User',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
      profile: {
        create: {
          fullNameEnglish: 'Admin User',
          mobile: '+971500000000',
          lifeScore: 100,
          walletBalance: 0,
          btcBalance: 0,
          usdtTrc20Balance: 0,
        }
      }
    },
    include: { profile: true }
  })
  
  console.log('✅ Created admin user:', admin.email)
  
  // Create operator user
  const operatorPasswordHash = await bcrypt.hash('Operator123!', 12)
  
  const operator = await prisma.user.upsert({
    where: { email: 'operator@maestropay.ae' },
    update: {},
    create: {
      email: 'operator@maestropay.ae',
      name: 'Operator User',
      passwordHash: operatorPasswordHash,
      role: 'OPERATOR',
      isActive: true,
      profile: {
        create: {
          fullNameEnglish: 'Operator User',
          mobile: '+971500000001',
          lifeScore: 88,
          walletBalance: 0,
          btcBalance: 0,
          usdtTrc20Balance: 0,
        }
      }
    },
    include: { profile: true }
  })
  
  console.log('✅ Created operator user:', operator.email)
  
  console.log('🎉 Seeding complete!')
  console.log('')
  console.log('Admin credentials:')
  console.log('  Email: admin@maestropay.ae')
  console.log('  Password: Admin123!')
  console.log('')
  console.log('Operator credentials:')
  console.log('  Email: operator@maestropay.ae')
  console.log('  Password: Operator123!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
