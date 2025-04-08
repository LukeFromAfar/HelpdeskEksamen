require('dotenv').config();
const mongoose = require('mongoose');
const argon2 = require('argon2');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const connectDB = require('../config/db');

// Connect to database
connectDB();

// Sample data - Users
const users = [
  {
    name: 'Admin User',
    email: 'admin@help.no',
    password: 'Passord123',
    role: 'admin'
  },
  {
    name: 'John Doe',
    email: 'john@help.no',
    password: 'Passord123',
    role: 'user'
  },
  {
    name: 'Jane Smith',
    email: 'jane@help.no',
    password: 'Passord123!',
    role: 'user'
  }
];

// Sample categories
const categories = ['Hardware', 'Software', 'Nettverk', 'Konto', 'Annet'];

// Sample statuses
const statuses = ['Åpen', 'Under arbeid', 'Løst', 'Lukket'];

// Sample priorities
const priorities = ['Høy', 'Medium', 'Lav'];

// Generate random ticket titles
const ticketTitles = [
  'Kan ikke logge inn på min konto',
  'Skriveren virker ikke',
  'Trenger tilgang til databasen',
  'Programmet krasjer stadig',
  'Nettverket er tregt',
  'Trenger hjelp med Excel',
  'Oppdatering feilet',
  'E-post synkroniserer ikke',
  'Skjermen viser blå skjerm',
  'Trenger ny programvare installert',
  'VPN tilkobling fungerer ikke',
  'Passord tilbakestilling'
];

// Generate random ticket descriptions
const ticketDescriptions = [
  'Jeg har prøvd å logge inn flere ganger, men får en feilmelding.',
  'Når jeg prøver å skrive ut, viser skriveren en feilmelding og dokumentet skrives ikke ut.',
  'Jeg trenger tilgang til markedsføringsdatabasen for mitt nye prosjekt.',
  'Programmet lukker seg selv når jeg prøver å lagre arbeidet mitt.',
  'Internett har vært veldig tregt hele dagen, og det påvirker arbeidet mitt.',
  'Jeg trenger hjelp med å sette opp en kompleks pivot tabell i Excel.',
  'Systemoppdateringen feilet, og jeg får en feilmelding ved oppstart.',
  'E-postene mine synkroniserer ikke mellom min PC og mobiltelefon.',
  'Min PC viser blå skjerm med en feilkode når jeg starter den.',
  'Jeg trenger Adobe Photoshop installert på min arbeidsmaskin.',
  'Jeg kan ikke koble til VPN-nettverket når jeg jobber hjemmefra.'
];

// Function to generate a random ticket
const generateTicket = (userId, index) => {
  // Distribute categories, statuses and priorities evenly
  const category = categories[index % categories.length];
  const status = statuses[index % statuses.length];
  const priority = priorities[index % priorities.length];
  
  return {
    title: ticketTitles[Math.floor(Math.random() * ticketTitles.length)],
    description: ticketDescriptions[Math.floor(Math.random() * ticketDescriptions.length)],
    category: category,
    user: userId,
    status: status,
    priority: priority,
    comments: [],
    history: [
      {
        action: 'Henvendelse opprettet',
        user: userId,
        timestamp: new Date()
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

// Seed the database
const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Ticket.deleteMany({});
    console.log('Database cleared');

    // Create users with hashed passwords
    const createdUsers = [];
    for (const user of users) {
      const hashedPassword = await argon2.hash(user.password);
      const newUser = await User.create({
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role
      });
      createdUsers.push(newUser);
      console.log(`Created user: ${user.name} (${user.role})`);
    }

    // Create tickets for each user
    let ticketCount = 0;
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      // Admin gets 3 tickets, regular users get 10 tickets each
      const ticketsToCreate = user.role === 'admin' ? 3 : 10;
      
      for (let j = 0; j < ticketsToCreate; j++) {
        const newTicket = await Ticket.create(generateTicket(user._id, ticketCount % (categories.length * statuses.length * priorities.length)));
        ticketCount++;
        console.log(`Created ticket: ${newTicket.title} for ${user.name}`);
      }
    }

    console.log(`Database seeding completed! Created ${createdUsers.length} users and ${ticketCount} tickets.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase();
