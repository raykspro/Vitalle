export const roles = {
  ADMIN: 'admin',
  VENDEDOR: 'vendedor',
};

export const isAdmin = (userRole) => userRole === roles.ADMIN;
export const isVendedor = (userRole) => userRole === roles.VENDEDOR;