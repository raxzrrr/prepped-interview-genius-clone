
# Interview Genius - AI-Powered Interview Preparation

## Project Overview

Interview Genius is an AI-powered platform designed to help you master your interview skills. Upload your resume, practice with personalized questions, and receive real-time feedback on your performance.

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

Follow these steps to set up the project locally:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies
npm i

# Step 4: Start the development server with auto-reloading and an instant preview
npm run dev
```

## Technologies Used

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Backend)
- Clerk (Authentication)

## Features

- AI-powered interview question generation
- Resume analysis and feedback
- Real-time voice-to-text interview practice
- Facial expression analysis during interviews
- Comprehensive performance reports
- Learning modules and assessments
- Certificate generation
- Admin dashboard for content management

## Environment Variables

Create a `.env` file in the root directory and add your environment variables:

```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Application pages
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── services/           # API and external service integrations
├── utils/              # Utility functions
└── integrations/       # Third-party integrations
```

## Deployment

The application can be deployed to any static hosting service such as:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
