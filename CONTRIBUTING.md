# Contributing to MarketBridge

Thank you for your interest in contributing to MarketBridge! We welcome contributions from everyone.

## Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/your-username/Marketbridge.git
    cd Marketbridge
    ```
3.  **Install dependencies**:
    ```bash
    cd client
    npm install
    ```
4.  **Set up environment variables**:
    - Copy `.env.example` to `.env.local` (if available) or follow `ENV_SETUP.md`.
    - You will need Firebase credentials to run the app locally.

5.  **Run the development server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to see the app.

## Development Workflow

1.  Create a new branch for your feature or fix:
    ```bash
    git checkout -b feature/amazing-feature
    ```
2.  Make your changes.
3.  Commit your changes with descriptive messages.
4.  Push to your fork:
    ```bash
    git push origin feature/amazing-feature
    ```
5.  Open a **Pull Request** on the main repository.

## Code Style

- We use **TypeScript** for type safety.
- We use **Tailwind CSS** for styling.
- Please ensure your code is clean and well-commented where necessary.

## Reporting Issues

If you find a bug or have a feature request, please open an issue on GitHub.

## License

This project is licensed under the ISC License.
