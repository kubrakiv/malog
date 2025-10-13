export const getEmailsFromOrder = (order, customers) => {
  const emails = new Set(); // Use a Set to avoid duplicates

  // Add the customer manager email
  if (customers) {
    const customer = customers?.find(
      (customer) => customer?.name === order?.customer
    );
    emails.add(customer?.email);
    const managerName = order.customer_manager;
    const manager = customer?.managers?.find(
      (manager) => manager.full_name === managerName
    );
    if (manager?.email) {
      emails.add(manager.email);
    }
  }

  // Add customer manager email from the order

  // Return the email list as an array
  return Array.from(emails);
};
