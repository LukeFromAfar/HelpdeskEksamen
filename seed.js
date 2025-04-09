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
    
    // Add 5 realistic support tickets with good responses
    console.log('Adding realistic support tickets with responses...');
    
    // Ticket 1: Network connectivity issue
    const networkTicket = await Ticket.create({
      title: 'Kan ikke koble til bedriftsnettverket',
      description: 'Jeg har problemer med å koble til bedriftsnettverket når jeg jobber hjemmefra. VPN-klienten får "Authentication failed" hver gang jeg prøver å koble til. Dette begynte i går ettermiddag.',
      category: 'Nettverk',
      user: normalUser1._id,
      status: 'Løst',
      priority: 'Høy',
      assignedTo: '1. linje',
      comments: [
        {
          user: firstLineUser._id,
          text: 'Hei John, jeg ser på saken din nå. Kan du bekrefte hvilken versjon av VPN-klienten du bruker?',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
        },
        {
          user: normalUser1._id,
          text: 'Jeg bruker versjon 4.2.1 som ble installert forrige måned.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23)
        },
        {
          user: firstLineUser._id,
          text: 'Takk for informasjonen. Det har vært en kjent feil med den versjonen. Kan du prøve å logge ut, slette alle lagrede VPN-profiler, og deretter logge inn på nytt?',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22)
        },
        {
          user: normalUser1._id,
          text: 'Det fungerte ikke. Samme feilmelding kommer opp.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 21)
        },
        {
          user: firstLineUser._id,
          text: 'Jeg eskalerer denne saken til 2. linje siden det kan være et problem med autentiseringsserveren.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20)
        },
        {
          user: secondLineUser._id,
          text: 'Hei! Jeg har verifisert at det var et problem med autentiseringsserveren. Vi har nå restartet serveren og det skal fungere igjen. Kan du prøve å koble til på nytt?',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10)
        },
        {
          user: normalUser1._id,
          text: 'Det fungerer perfekt nå! Takk for hjelpen.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8)
        }
      ],
      history: [
        {
          action: 'Henvendelse opprettet',
          user: normalUser1._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25)
        },
        {
          action: 'Status endret fra Åpen til Under arbeid',
          user: firstLineUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24)
        },
        {
          action: 'Tildeling endret fra Ikke tildelt til 1. linje',
          user: firstLineUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24)
        },
        {
          action: 'Tildeling endret fra 1. linje til 2. linje',
          user: firstLineUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20)
        },
        {
          action: 'Status endret fra Under arbeid til Løst',
          user: secondLineUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8)
        }
      ],
      feedback: {
        rating: 5,
        comment: 'Utmerket support! Problemet ble løst effektivt og kommunikasjonen var god.',
        user: normalUser1._id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5)
      },
      hasFeedback: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5)
    });
    console.log(`Created realistic ticket: ${networkTicket.title}`);
  
    // Ticket 2: Software installation problem
    const softwareTicket = await Ticket.create({
      title: 'Kan ikke installere Excel',
      description: 'Når jeg prøver å installere Microsoft Excel fra Office portalen får jeg feilkode 0x80070652. Jeg har prøvd å installere flere ganger men får samme feil.',
      category: 'Software',
      user: normalUser2._id,
      status: 'Løst',
      priority: 'Medium',
      assignedTo: '1. linje',
      comments: [
        {
          user: firstLineUser._id,
          text: 'Hei Jane, takk for henvendelsen. Denne feilkoden indikerer at en tidligere installasjon ikke ble fullført riktig. Kan du prøve følgende: 1) Gå til Kontrollpanel > Program og funksjoner, 2) Avinstaller alle Office-komponenter, 3) Last ned Office reparasjonsverktøyet fra https://aka.ms/SaRA-officeUninstall-sis, 4) Kjør verktøyet og følg instruksjonene.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48)
        },
        {
          user: normalUser2._id,
          text: 'Jeg følgte alle stegene, men får fremdeles samme feilmelding når jeg prøver å installere.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 45)
        },
        {
          user: firstLineUser._id,
          text: 'La oss prøve en annen tilnærming. Kan du sjekke om det finnes noen Windows-oppdateringer som venter på installasjon? Noen ganger kan utstående oppdateringer forårsake installasjons-problemer.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 44)
        },
        {
          user: normalUser2._id,
          text: 'Ja, det var faktisk noen ventende oppdateringer. Jeg installerte dem og startet datamaskinen på nytt, men får fortsatt samme feilkode.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 40)
        },
        {
          user: firstLineUser._id,
          text: 'Takk for oppdateringen. Jeg tror vi trenger en mer avansert feilsøking her. Jeg eskalerer saken til 2. linje support.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 38)
        },
        {
          user: secondLineUser._id,
          text: 'Hei Jane, jeg har sett på henvendelsen din. Dette ser ut til å være et problem med Windows Installer Database. Jeg har laget et fjernstyrings-møte for deg. Kan du bekrefte om kl. 14:00 i dag passer for deg?',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 35)
        },
        {
          user: normalUser2._id,
          text: 'Kl. 14:00 passer fint for meg. Takk!',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 34)
        },
        {
          user: secondLineUser._id,
          text: 'Jeg har nå reparert Windows Installer Database og vi har installert Excel på maskinen din. Problemet var forårsaket av korrupte registerinnstillinger fra en tidligere avbrutt installasjon. Alt skal fungere normalt nå.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30)
        },
        {
          user: normalUser2._id,
          text: 'Excel fungerer perfekt nå! Tusen takk for hjelpen.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28)
        }
      ],
      history: [
        {
          action: 'Henvendelse opprettet',
          user: normalUser2._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 50)
        },
        {
          action: 'Status endret fra Åpen til Under arbeid',
          user: firstLineUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48)
        },
        {
          action: 'Tildeling endret fra Ikke tildelt til 1. linje',
          user: firstLineUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48)
        },
        {
          action: 'Tildeling endret fra 1. linje til 2. linje',
          user: firstLineUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 38)
        },
        {
          action: 'Status endret fra Under arbeid til Løst',
          user: secondLineUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28)
        }
      ],
      feedback: {
        rating: 5,
        comment: 'Veldig profesjonell support. Jeg satte pris på fjernhjelpen og tydelige forklaringer.',
        user: normalUser2._id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25)
      },
      hasFeedback: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 25)
    });
    console.log(`Created realistic ticket: ${softwareTicket.title}`);
  
    // Ticket 3: Password reset
    const passwordTicket = await Ticket.create({
      title: 'Trenger tilbakestilling av passord',
      description: 'Jeg har glemt passordet mitt til Azure-portalen. Kan dere hjelpe meg med å tilbakestille det?',
      category: 'Konto',
      user: normalUser1._id,
      status: 'Løst',
      priority: 'Lav',
      assignedTo: '1. linje',
      comments: [
        {
          user: firstLineUser._id,
          text: 'Hei John, jeg kan hjelpe deg med dette. Av sikkerhetsgrunner må jeg verifisere identiteten din. Kan du bekrefte telefonnummeret som er registrert på kontoen din?',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12)
        },
        {
          user: normalUser1._id,
          text: 'Mitt registrerte nummer er 98765432.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 11)
        },
        {
          user: firstLineUser._id,
          text: 'Takk for bekreftelsen. Jeg har nå sendt en engangskode til både din registrerte e-post og SMS til telefonnummeret. Når du har mottatt koden, kan du bruke den til å sette et nytt passord via lenken i e-posten.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10)
        },
        {
          user: normalUser1._id,
          text: 'Jeg har mottatt koden og tilbakestilt passordet mitt. Takk for rask hjelp!',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 9)
        }
      ],
      history: [
        {
          action: 'Henvendelse opprettet',
          user: normalUser1._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 13)
        },
        {
          action: 'Status endret fra Åpen til Under arbeid',
          user: firstLineUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12)
        },
        {
          action: 'Tildeling endret fra Ikke tildelt til 1. linje',
          user: firstLineUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12)
        },
        {
          action: 'Status endret fra Under arbeid til Løst',
          user: firstLineUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 9)
        }
      ],
      feedback: {
        rating: 5,
        comment: 'Rask og effektiv hjelp!',
        user: normalUser1._id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8)
      },
      hasFeedback: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 13),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8)
    });
    console.log(`Created realistic ticket: ${passwordTicket.title}`);
  
    // Ticket 4: Hardware issue
    const hardwareTicket = await Ticket.create({
      title: 'Skjerm blinker og slår seg av',
      description: 'Min dataskjerm har begynt å blinke og slår seg plutselig av etter ca. 10 minutter med bruk. Dette skjer selv om jeg kobler den til en annen datamaskin.',
      category: 'Hardware',
      user: normalUser2._id,
      status: 'Løst',
      priority: 'Medium',
      assignedTo: '2. linje',
      comments: [
        {
          user: firstLineUser._id,
          text: 'Hei Jane, beklager å høre om skjermproblemet. La oss sjekke noen grunnleggende ting: 1) Har du prøvd en annen strømkabel? 2) Er det synlige skader på skjermen eller kablene? 3) Når skjedde dette første gang?',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 32)
        },
        {
          user: normalUser2._id,
          text: 'Jeg har prøvd en annen strømkabel, men problemet fortsetter. Ingen synlige skader på skjerm eller kabler. Dette begynte for ca. 3 dager siden.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 31)
        },
        {
          user: firstLineUser._id,
          text: 'Takk for informasjonen. Siden du har bekreftet at problemet vedvarer med både forskjellige datamaskiner og strømkabler, virker dette som et internt problem med skjermen. Dette må håndteres av 2. linje support for en mulig utskifting.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30)
        },
        {
          user: secondLineUser._id,
          text: 'Hei Jane, jeg ser at du har en Dell U2419H-skjerm under garanti. Basert på symptomene ser dette ut som en feil på strømforsyningen inni skjermen. Jeg har registrert en garantisak hos Dell, og de vil sende en tekniker til kontoret ditt i morgen mellom kl 9-12 for å bytte skjermen. Kan du bekrefte om dette tidspunktet passer?',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
        },
        {
          user: normalUser2._id,
          text: 'Ja, det tidspunktet passer fint. Takk!',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23)
        },
        {
          user: secondLineUser._id,
          text: 'Bare hyggelig! Jeg har notert dette i saken og bekreftet tidspunktet med Dell. De vil kontakte deg direkte på telefon når teknikeren er på vei.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22)
        },
        {
          user: normalUser2._id,
          text: 'Teknikeren kom i dag og byttet skjermen. Alt fungerer perfekt nå.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4)
        }
      ],
      history: [
        {
          action: 'Henvendelse opprettet',
          user: normalUser2._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 33)
        },
        {
          action: 'Status endret fra Åpen til Under arbeid',
          user: firstLineUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 32)
        },
        {
          action: 'Tildeling endret fra Ikke tildelt til 1. linje',
          user: firstLineUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 32)
        },
        {
          action: 'Tildeling endret fra 1. linje til 2. linje',
          user: firstLineUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 30)
        },
        {
          action: 'Status endret fra Under arbeid til Løst',
          user: secondLineUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3)
        }
      ],
      feedback: {
        rating: 5,
        comment: 'Profesjonell håndtering av hele prosessen. Veldig fornøyd!',
        user: normalUser2._id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
      },
      hasFeedback: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 33),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
    });
    console.log(`Created realistic ticket: ${hardwareTicket.title}`);
  
    // Ticket 5: Internet connectivity
    const internetTicket = await Ticket.create({
      title: 'Internett-tilkobling ustabil i møterom 3',
      description: 'Internett-tilkoblingen i møterom 3 er svært ustabil. Vi opplever hyppige brudd under videomøter som forstyrrer våre kundemøter. Dette har pågått i ca. en uke.',
      category: 'Nettverk',
      user: normalUser1._id,
      status: 'Løst',
      priority: 'Høy',
      assignedTo: 'admin',
      comments: [
        {
          user: firstLineUser._id,
          text: 'Hei John, takk for rapporten. Kan du bekrefte om problemet er bare med trådløst nettverk eller også med kablet tilkobling?',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 70)
        },
        {
          user: normalUser1._id,
          text: 'Vi har bare prøvd trådløst, siden laptopene våre ikke har nettverksport.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 69)
        },
        {
          user: firstLineUser._id,
          text: 'Forstått. Kan du også fortelle meg om problemet oppstår på samme tid på dagen eller tilfeldig?',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 68)
        },
        {
          user: normalUser1._id,
          text: 'Det virker helt tilfeldig, men skjer oftest midt i møter når vi har videokonferanser.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 67)
        },
        {
          user: firstLineUser._id,
          text: 'Takk for informasjonen. Dette høres ut som et problem som krever en fysisk undersøkelse av nettverksutstyret. Jeg eskalerer saken til 2. linje.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 66)
        },
        {
          user: secondLineUser._id,
          text: 'Hei, jeg har nå undersøkt trådløsdekningen i møterom 3. Jeg oppdaget at det er interferens fra en nylig installert klimaenhet som forstyrrer WiFi-signalet. Dette krever noen innstillingsendringer på nettverksinfrastrukturen som må utføres av admin.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 60)
        },
        {
          user: adminUser._id,
          text: 'Jeg har nå gjort følgende endringer: 1) Flyttet WiFi-kanalen for aksesspunktet nærmest møterom 3 for å unngå interferens, 2) Økt signalstyrken, 3) Installert et ekstra aksesspunkt for å gi bedre dekning. Kan dere teste om tilkoblingen er stabil nå?',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48)
        },
        {
          user: normalUser1._id,
          text: 'Vi har nå testet over flere møter de siste to dagene, og tilkoblingen er helt stabil. Problemet er løst. Tusen takk!',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
        }
      ],
      history: [
        {
          action: 'Henvendelse opprettet',
          user: normalUser1._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72)
        },
        {
          action: 'Status endret fra Åpen til Under arbeid',
          user: firstLineUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 70)
        },
        {
          action: 'Tildeling endret fra Ikke tildelt til 1. linje',
          user: firstLineUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 70)
        },
        {
          action: 'Tildeling endret fra 1. linje til 2. linje',
          user: firstLineUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 66)
        },
        {
          action: 'Tildeling endret fra 2. linje til admin',
          user: secondLineUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 60)
        },
        {
          action: 'Status endret fra Under arbeid til Løst',
          user: adminUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24)
        }
      ],
      feedback: {
        rating: 4,
        comment: 'God løsning, selv om det tok litt tid. Nå fungerer alt fint!',
        user: normalUser1._id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20)
      },
      hasFeedback: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 20)
    });
    console.log(`Created realistic ticket: ${internetTicket.title}`);
    
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
