# Pulse Security Scanner

This project is a **QR Code-based Security Scanner** developed to track the sign-in and sign-out of operatives at events. It features a robust user interface with Toastify notifications and integrates scanning logic for event tracking. The app allows users to register their details, scan in and out, and export data.

## Features

- **Registration Page**: Operatives can register their details (name, company, and license number) and receive a QR code.
- **Scanner Page**: Scan QR codes, automatically register operatives, and track their event participation.
- **Admin Controls**: Reset data and export CSV of scanned entries behind an admin lock.
- **Real-Time Data**: View scanned entries in a table, displaying information like name, email, event, start time, and finish time.
- **Toast Notifications**: For actions like starting the scanner, scanning in/out, and errors.
- **QR Code Generation**: Generates QR codes for operatives after registration.
  
## Technologies Used

- **React**: Frontend framework for building the user interface.
- **Vite**: A fast build tool for modern web projects.
- **TypeScript**: Superset of JavaScript for type safety and better development experience.
- **Shadcn/ui**: For consistent and beautiful UI components.
- **react-toastify**: For toast notifications (success, error, info).
- **html5-qrcode**: QR code scanner for both web and mobile devices.
- **Tailwind CSS**: Utility-first CSS framework for fast styling.

## Setup Instructions

### Prerequisites

1. **Node.js**: Make sure you have **Node.js** installed on your system.
2. **npm**: Use **npm** or **yarn** for package management.

### Steps to Get Started

1. Clone the repository:

   ```bash
   git clone https://github.com/chris-88/pulse-security.git
   cd pulse-security
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open the app in your browser on [http://localhost:5173](http://localhost:5173).

## Key Features

### Registration Flow

1. **User enters their details** (Name, Company, and optionally, License Number).
2. **QR Code generation**: After filling in the details, the QR code for the user will be generated.
3. **Modal for License Number**: If the user has their PSA License, it will be prompted, else they can proceed with their details.

### Scanner Flow

1. **Scan QR Code**: The QR code scanner is triggered to capture the user's code.
2. **Automatic Sign-in and Sign-out**: Upon scanning a registered user, they are signed in or out based on the current event.
3. **Real-time Data Display**: Scanned entries appear in a table with their event data, name, and times.
4. **Admin Access**: Admin controls for resetting the data and exporting it as a CSV are behind a lock feature.

### Toast Notifications

- Success and error toasts are shown during important actions like registration, scanning, and sign-out.

### Admin Controls

- **Reset Data**: Removes all scanned entries.
- **Download CSV**: Exports scanned entry data to CSV.

## Deployment

1. **GitHub Pages**: To deploy the app to GitHub Pages, run:

   ```bash
   npm run deploy
   ```

   This will build the project and push it to the `gh-pages` branch. The app will be available at:

   ```bash
   https://chris-88.github.io/pulse-security
   ```

## Troubleshooting

1. **QR Code not detected**: Ensure you grant camera permissions for the app to function correctly.
2. **Toast notifications not appearing**: Ensure you have the `ToastContainer` in your component tree and that `react-toastify` is correctly configured.
3. **Camera issues on mobile**: Ensure your device has a working camera, and that the browser supports the HTML5 camera API.

## Contributing

Feel free to fork this repository, submit issues, or create pull requests to contribute. Any enhancements or bug fixes are highly appreciated!

1. Fork the repository.
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Create a new Pull Request.

## License

This project is open-source and available under the [MIT License](LICENSE).