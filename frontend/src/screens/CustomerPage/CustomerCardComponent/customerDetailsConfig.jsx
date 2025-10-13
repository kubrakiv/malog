import { v4 as uuidv4 } from "uuid";

const getCustomerDetails = (customer) => [
  {
    id: uuidv4(),
    title: "Замовник",
    value: customer.name,
  },
  {
    id: uuidv4(),
    title: "NIP Number",
    value: customer.nip_number,
  },
  {
    id: uuidv4(),
    title: "VAT Number",
    value: customer.vat_number || "Відсутній",
  },
  {
    id: uuidv4(),
    title: "Email",
    value: customer.email,
  },
  {
    id: uuidv4(),
    title: "Website",
    value: (
      <a href={customer.website} target="_blank" rel="noopener noreferrer">
        {customer.website}
      </a>
    ),
  },

  {
    id: uuidv4(),
    title: "Поштова адреса",
    value: !customer.post_address ? "Відсутня" : customer.post_address,
  },
];

export default getCustomerDetails;
