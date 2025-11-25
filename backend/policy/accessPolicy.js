// Role-based access policy map
// Defines which roles can perform which actions on resources.
// Ownership-sensitive actions have both a general and Own variant.
// Example actions: create, read, update, delete, updateOwn, deleteOwn

const Roles = {
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  GUEST: 'Guest'
};

// Policy per resource. Adjust as business rules evolve.
// For Guests: can create/read own Items/Orders and update/delete only own.
// Managers/Admins: full access.
const accessPolicy = {
  Item: {
    create: [Roles.ADMIN, Roles.MANAGER, Roles.GUEST],
    read: [Roles.ADMIN, Roles.MANAGER, Roles.GUEST],
    update: [Roles.ADMIN, Roles.MANAGER],
    updateOwn: [Roles.GUEST],
    delete: [Roles.ADMIN, Roles.MANAGER],
    deleteOwn: [Roles.GUEST]
  },
  Order: {
    create: [Roles.ADMIN, Roles.MANAGER, Roles.GUEST],
    read: [Roles.ADMIN, Roles.MANAGER, Roles.GUEST],
    update: [Roles.ADMIN, Roles.MANAGER],
    updateOwn: [Roles.GUEST],
    delete: [Roles.ADMIN, Roles.MANAGER],
    deleteOwn: [Roles.GUEST]
  },
  Logs: {
    read: [Roles.ADMIN]
  },
  Category: {
    create: [Roles.ADMIN, Roles.MANAGER],
    read: [Roles.ADMIN, Roles.MANAGER, Roles.GUEST],
    update: [Roles.ADMIN, Roles.MANAGER],
    delete: [Roles.ADMIN, Roles.MANAGER]
  },
  Workout: {
    create: [Roles.ADMIN, Roles.MANAGER],
    read: [Roles.ADMIN, Roles.MANAGER, Roles.GUEST],
    update: [Roles.ADMIN, Roles.MANAGER],
    delete: [Roles.ADMIN, Roles.MANAGER]
  },
  Transaction: {
    read: [Roles.ADMIN, Roles.MANAGER, Roles.GUEST]
  }
};

module.exports = { accessPolicy, Roles };