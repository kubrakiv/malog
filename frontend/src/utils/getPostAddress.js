export const getPostAddressFromOrder = (order, customers) => {
  if (!order || !customers) {
    console.warn("Order or customers data is missing.");
    return null;
  }

  // Find the customer in the customers array based on the order's customer name
  const customer = customers.find(
    (customer) => customer?.name === order?.customer
  );

  // Return the post_address or null if not found
  return customer?.post_address || null;
};
