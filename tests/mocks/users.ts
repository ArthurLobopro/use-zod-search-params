import { type User, UserRole, UserStatus } from "../types";

const FIRST_NAMES = [
  "Emma",
  "Liam",
  "Olivia",
  "Noah",
  "Ava",
  "Oliver",
  "Isabella",
  "Elijah",
  "Mia",
  "Lucas",
  "Charlotte",
  "Mason",
  "Amelia",
  "Logan",
  "Harper",
  "Alexander",
  "Evelyn",
  "Ethan",
  "Abigail",
  "Jacob",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Brown",
  "Taylor",
  "Miller",
  "Wilson",
  "Moore",
  "Davis",
  "Garcia",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Anderson",
  "Thomas",
  "Jackson",
  "White",
  "Harris",
  "Martin",
];

const ROLES = [UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER];
const STATUSES = [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.PENDING];

// Deterministic pseudo-random number generator for consistency across re-renders if needed
const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

export const generateUsers = (count: number): User[] => {
  return Array.from({ length: count }).map((_, index) => {
    const seed = index + 1;
    const firstName =
      FIRST_NAMES[Math.floor(pseudoRandom(seed * 2) * FIRST_NAMES.length)];
    const lastName =
      LAST_NAMES[Math.floor(pseudoRandom(seed * 3) * LAST_NAMES.length)];
    const role = ROLES[Math.floor(pseudoRandom(seed * 4) * ROLES.length)];
    const status =
      STATUSES[Math.floor(pseudoRandom(seed * 5) * STATUSES.length)];

    // Generate dates within the last year
    const now = new Date();
    const createdDaysAgo = Math.floor(pseudoRandom(seed * 6) * 365);
    const createdAt = new Date(
      now.getTime() - createdDaysAgo * 24 * 60 * 60 * 1000,
    );

    // Last login sometime after created at
    const lastLoginDaysAgo = Math.floor(
      pseudoRandom(seed * 7) * createdDaysAgo,
    );
    const lastLogin = new Date(
      now.getTime() - lastLoginDaysAgo * 24 * 60 * 60 * 1000,
    );

    return {
      id: `usr_${index + 1000}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      role,
      status,
      createdAt: createdAt.toISOString(),
      lastLogin: lastLogin.toISOString(),
    };
  });
};

export const USERS_MOCK_DATA = generateUsers(100);
