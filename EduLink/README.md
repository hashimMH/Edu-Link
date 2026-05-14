
### Folder Details

- **`models`**: Contains the data-related logic, including API requests, local storage, and business logic. Models do not handle view-related tasks; they only focus on managing and processing data.
  
- **`views`**: This is the UI layer where components render data and define the application's look. Views receive data and functions from the controller to display content and handle user interactions.
  
- **`controllers`**: Acts as an intermediary between models and views. Controllers fetch data from models and pass it to views, handling any user interaction events and coordinating actions based on user inputs.
  
- **`services`**: Contains reusable functions, such as API utilities, that support the app's logic.


## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js**: Recommended version 14 or higher
- **React Native CLI**

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/zane-technology/zane-academy-app.git

## File Stucture
```main
 ├── src
 │   ├── models          # Data layer
 │   │   └── UserModel.ts
 │   ├── views           # UI layer
 │   │   └── UserScreen.ts
 │   ├── controllers     # Controller layer
 │   │   └── UserController.js
 │   ├── services        # API or utility services
 │   │   └── ApiService.ts
 │   └── App.tsx
