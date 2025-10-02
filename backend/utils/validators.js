export const validateOrderParams = (order, direction, validOrders) => {
  const validDirections = ['ASC', 'DESC'];
  return {
    order: validOrders.includes(order) ? order : validOrders[0],
    direction: validDirections.includes(direction?.toUpperCase()) ? direction.toUpperCase() : 'ASC'
  };
};

export const handleDbError = (error, operation) => {
  console.error(`Error ${operation}:`, error);
  
  if (error.code === '23505') {
    const constraint = error.constraint;
    if (constraint?.includes('email')) return new Error('Email already exists');
    if (constraint?.includes('pseudo')) return new Error('Pseudo already exists');
    if (constraint?.includes('isbn')) return new Error('ISBN already exists');
    return new Error('Duplicate value');
  }
  
  if (error.code === '23503') {
    return new Error('Foreign key constraint violation');
  }
  
  if (error.code === '23514') {
    return new Error('Check constraint violation');
  }
  
  return new Error(`Failed to ${operation}`);
};
