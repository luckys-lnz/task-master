# Task Master

A beautiful task management application built with Next.js and PostgreSQL.

## Features

- 🔐 Authentication with Next-Auth
- 📝 Task management
- 🎨 Beautiful UI with dark mode support
- 📱 Responsive design
- 🚀 Fast and performant
- 🔄 Real-time updates
- 📊 Task analytics

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Next-Auth Authentication
- Supabase (PostgreSQL) with Drizzle ORM
- Sonner for toast notifications

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/yourusername/task-master.git
cd task-master
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file with the following variables:
```env
# Supabase Database Connection
# Get this from: Supabase Dashboard > Project Settings > Database > Connection string
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Or for local PostgreSQL:
# DATABASE_URL=postgresql://tm@localhost:5432/taskmaster

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

4. Set up the database
The database schema has already been applied to Supabase. If you're using a local database:
```bash
npm run db:generate
npm run db:migrate
```

5. Start the development server
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Community

Have a question, an idea, or want to show off what you built? Head over to [GitHub Discussions](https://github.com/LivinginPixel/task-master/discussions):

- **Ideas** — propose new features or improvements
- **Q&A** — ask for help using or setting up the app
- **Show and tell** — share what you have built or customized
- **General** — anything else

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.