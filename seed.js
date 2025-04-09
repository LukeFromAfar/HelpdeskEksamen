const mongoose = require('mongoose');
const argon2 = require('argon2');
const dotenv = require('dotenv');
const User = require('./models/User');
const Ticket = require('./models/Ticket');

// Load environment variables
dotenv.config();

// Seed function
async function seedDatabase() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Ticket.deleteMany({});
    console.log('Existing data cleared');
    
    // Create users
    console.log('Creating users...');
    
    // 1 admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@help.no',
      password: 'Passord123', // Will be hashed by the pre-save middleware
      role: 'admin',
      createdAt: new Date()
    });
    console.log(`Created admin user: ${adminUser.name} (${adminUser.role})`);
    
    // 1 first line support
    const firstLineUser = await User.create({
      name: 'First Line Support',
      email: 'firstline@help.no',
      password: 'Passord123', // Will be hashed by the pre-save middleware
      role: '1. linje',
      createdAt: new Date()
    });
    console.log(`Created 1. linje user: ${firstLineUser.name}`);
    
    // 1 second line support
    const secondLineUser = await User.create({
      name: 'Second Line Support',
      email: 'secondline@help.no',
      password: 'Passord123', // Will be hashed by the pre-save middleware
      role: '2. linje',
      createdAt: new Date()
    });
    console.log(`Created 2. linje user: ${secondLineUser.name}`);
    
    // 2 normal users
    const normalUser1 = await User.create({
      name: 'John Doe',
      email: 'john@help.no',
      password: 'Passord123', // Will be hashed by the pre-save middleware
      role: 'user',
      createdAt: new Date()
    });
    console.log(`Created standard user: ${normalUser1.name}`);
    
    const normalUser2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@help.no',
      password: 'Passord123', // Will be hashed by the pre-save middleware
      role: 'user',
      createdAt: new Date()
    });
    console.log(`Created standard user: ${normalUser2.name}`);
    
    console.log('All users created successfully');
    
    // Create tickets
    console.log('Creating tickets...');
    
    // 3 tickets for admin
    for (let i = 0; i < 3; i++) {
      const ticket = await Ticket.create({
        title: `Admin Ticket ${i+1}`,
        description: `This is a test ticket ${i+1} created by the admin user.`,
        category: ['Hardware', 'Software', 'Nettverk'][i % 3],
        user: adminUser._id,
        status: ['Åpen', 'Under arbeid', 'Løst'][i % 3],
        priority: ['Lav', 'Medium', 'Høy'][i % 3],
        assignedTo: i % 2 === 0 ? null : (i % 3 === 1 ? '1. linje' : '2. linje'),
        comments: i > 0 ? [
          {
            text: `Comment on admin ticket ${i+1}`,
            user: adminUser._id,
            createdAt: new Date()
          }
        ] : [],
        history: [
          {
            action: 'Henvendelse opprettet',
            user: adminUser._id,
            timestamp: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Created admin ticket: ${ticket.title}`);
    }
    
    // 1 ticket for first line support
    const firstLineTicket = await Ticket.create({
      title: 'First Line Support Ticket',
      description: 'This is a ticket created by the first line support.',
      category: 'Software',
      user: firstLineUser._id,
      status: 'Åpen',
      priority: 'Medium',
      assignedTo: null,
      comments: [],
      history: [
        {
          action: 'Henvendelse opprettet',
          user: firstLineUser._id,
          timestamp: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`Created first line ticket: ${firstLineTicket.title}`);
    
    // 1 ticket for second line support
    const secondLineTicket = await Ticket.create({
      title: 'Second Line Support Ticket',
      description: 'This is a ticket created by the second line support.',
      category: 'Nettverk',
      user: secondLineUser._id,
      status: 'Under arbeid',
      priority: 'Høy',
      assignedTo: 'admin',
      comments: [
        {
          text: 'This requires admin attention.',
          user: secondLineUser._id,
          createdAt: new Date()
        },
        {
          text: 'I will look into this issue.',
          user: adminUser._id,
          createdAt: new Date(Date.now() + 1000 * 60 * 60)
        }
      ],
      history: [
        {
          action: 'Henvendelse opprettet',
          user: secondLineUser._id,
          timestamp: new Date()
        },
        {
          action: 'Status endret fra Åpen til Under arbeid',
          user: adminUser._id,
          timestamp: new Date(Date.now() + 1000 * 60 * 30)
        },
        {
          action: 'Tildeling endret fra Ikke tildelt til admin',
          user: adminUser._id,
          timestamp: new Date(Date.now() + 1000 * 60 * 30)
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(Date.now() + 1000 * 60 * 60)
    });
    console.log(`Created second line ticket: ${secondLineTicket.title}`);

    // 11 tickets for normal user 1
    for (let i = 0; i < 11; i++) {
      const status = ['Åpen', 'Under arbeid', 'Løst', 'Lukket'][i % 4];
      const assignedTo = status === 'Åpen' ? null : 
                         status === 'Under arbeid' ? (i % 2 === 0 ? '1. linje' : '2. linje') :
                         status === 'Løst' ? (i % 2 === 0 ? '1. linje' : '2. linje') : null;
      
      const ticket = await Ticket.create({
        title: `User1 Ticket ${i+1}`,
        description: `This is ticket ${i+1} created by user John Doe.`,
        category: ['Hardware', 'Software', 'Nettverk', 'Konto', 'Annet'][i % 5],
        user: normalUser1._id,
        status: status,
        priority: ['Lav', 'Medium', 'Høy'][i % 3],
        assignedTo: assignedTo,
        comments: i % 3 === 0 ? [
          {
            text: `Comment on ticket ${i+1}`,
            user: normalUser1._id,
            createdAt: new Date()
          }
        ] : [],
        history: [
          {
            action: 'Henvendelse opprettet',
            user: normalUser1._id,
            timestamp: new Date()
          },
          ...(status !== 'Åpen' ? [{
            action: `Status endret fra Åpen til ${status}`,
            user: assignedTo === '1. linje' ? firstLineUser._id : 
                 assignedTo === '2. linje' ? secondLineUser._id : adminUser._id,
            timestamp: new Date(Date.now() + 1000 * 60 * 30)
          }] : []),
          ...(assignedTo ? [{
            action: `Tildeling endret fra Ikke tildelt til ${assignedTo}`,
            user: assignedTo === '1. linje' ? firstLineUser._id : 
                 assignedTo === '2. linje' ? secondLineUser._id : adminUser._id,
            timestamp: new Date(Date.now() + 1000 * 60 * 30)
          }] : [])
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * i), // Spread tickets over days
        updatedAt: status !== 'Åpen' ? new Date(Date.now() - 1000 * 60 * 60 * 24 * i + 1000 * 60 * 30) : new Date(Date.now() - 1000 * 60 * 60 * 24 * i)
      });
      console.log(`Created user1 ticket: ${ticket.title}`);
    }

    // 11 tickets for normal user 2
    for (let i = 0; i < 11; i++) {
      const status = ['Åpen', 'Under arbeid', 'Løst', 'Lukket'][i % 4];
      const assignedTo = status === 'Åpen' ? null : 
                         status === 'Under arbeid' ? (i % 2 === 0 ? '1. linje' : '2. linje') :
                         status === 'Løst' ? (i % 2 === 0 ? '1. linje' : '2. linje') : null;
      
      const ticket = await Ticket.create({
        title: `User2 Ticket ${i+1}`,
        description: `This is ticket ${i+1} created by user Jane Smith.`,
        category: ['Hardware', 'Software', 'Nettverk', 'Konto', 'Annet'][i % 5],
        user: normalUser2._id,
        status: status,
        priority: ['Lav', 'Medium', 'Høy'][i % 3],
        assignedTo: assignedTo,
        comments: i % 3 === 0 ? [
          {
            text: `Comment on ticket ${i+1}`,
            user: normalUser2._id,
            createdAt: new Date()
          }
        ] : [],
        history: [
          {
            action: 'Henvendelse opprettet',
            user: normalUser2._id,
            timestamp: new Date()
          },
          ...(status !== 'Åpen' ? [{
            action: `Status endret fra Åpen til ${status}`,
            user: assignedTo === '1. linje' ? firstLineUser._id : 
                 assignedTo === '2. linje' ? secondLineUser._id : adminUser._id,
            timestamp: new Date(Date.now() + 1000 * 60 * 30)
          }] : []),
          ...(assignedTo ? [{
            action: `Tildeling endret fra Ikke tildelt til ${assignedTo}`,
            user: assignedTo === '1. linje' ? firstLineUser._id : 
                 assignedTo === '2. linje' ? secondLineUser._id : adminUser._id,
            timestamp: new Date(Date.now() + 1000 * 60 * 30)
          }] : [])
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (i + 11)), // More spreading
        updatedAt: status !== 'Åpen' ? new Date(Date.now() - 1000 * 60 * 60 * 24 * (i + 11) + 1000 * 60 * 30) : new Date(Date.now() - 1000 * 60 * 60 * 24 * (i + 11))
      });
      console.log(`Created user2 ticket: ${ticket.title}`);
    }
    
    // Count all created entities
    const userCount = await User.countDocuments();
    const ticketCount = await Ticket.countDocuments();
    
    console.log(`Database seeded successfully with ${userCount} users and ${ticketCount} tickets`);
    console.log('- 1 Admin user with 3 tickets');
    console.log('- 1 First line support with 1 ticket');
    console.log('- 1 Second line support with 1 ticket');
    console.log('- 2 Normal users with 11 tickets each');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the seed function
seedDatabase().catch(err => {
  console.error('Failed to seed database:', err);
  process.exit(1);
});
