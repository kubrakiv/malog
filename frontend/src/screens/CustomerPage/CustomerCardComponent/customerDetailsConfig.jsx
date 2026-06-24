import { v4 as uuidv4 } from "uuid";

const getCustomerDetails = (customer) => [
  {
    id: uuidv4(),
    title: "Назва компанії",
    value: customer.name,
  },
  {
    id: uuidv4(),
    title: "Податковий номер",
    value: customer.nip_number || "Відсутній",
  },
  {
    id: uuidv4(),
    title: "VAT номер",
    value: customer.vat_number || "Відсутній",
  },
  {
    id: uuidv4(),
    title: "Email",
    value: customer.email || "Відсутній",
  },
  {
    id: uuidv4(),
    title: "Вебсайт",
    value: customer.website ? (
      <a href={customer.website} target="_blank" rel="noopener noreferrer">
        {customer.website}
      </a>
    ) : "Відсутній",
  },
  {
    id: uuidv4(),
    title: "Поштова адреса",
    value: customer.post_address || "Відсутня",
  },
  {
    id: uuidv4(),
    title: "Юридична адреса",
    value: customer.legal_address || "Відсутня",
  },
];

export default getCustomerDetails;
