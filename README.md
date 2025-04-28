# Task Master

A beautiful task management application built with Next.js, Clerk, and PostgreSQL.

## Features

- 🔐 Authentication with Clerk
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
- Clerk Authentication
- PostgreSQL with Drizzle ORM
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
Create a `.env.local` file with the following variables:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
DATABASE_URL=postgresql://user:password@localhost:5432/taskmaster
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Set up the database
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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.