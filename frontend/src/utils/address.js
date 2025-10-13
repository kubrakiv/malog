export const getFullAddress = (selectedPoint) => {
  const { postal_code, city, country_short, street, street_number } =
    selectedPoint;
  return `${country_short}-${postal_code} ${city}, ${street}, ${street_number}`;
};
