import { transliterate as tr } from "transliteration";

export const getCountry = (obj) => {
  const countryComponent = obj.address_components.find((component) =>
    component.types.includes("country")
  );

  const country = countryComponent ? countryComponent.long_name : "";
  return country === "Czechia" ? "Czech Republic" : country;
};

export const getStreet = (obj) => {
  const streetComponent = obj.address_components.find(
    (component) =>
      component.types.includes("route") || component.types.includes("street")
  );
  return tr(streetComponent) ? tr(streetComponent?.long_name) : "";
};

export const getStreetNumber = (obj) => {
  const streetNumberComponent = obj.address_components.find((component) =>
    component.types.includes("street_number")
  );
  return streetNumberComponent ? streetNumberComponent.long_name : "";
};

export const getCity = (obj) => {
  const types = [
    "administrative_area_level_3",
    "locality",
    "sublocality",
    "administrative_area_level_2",
  ];

  for (const type of types) {
    const cityComponent = obj.address_components.find((component) =>
      component.types.includes(type)
    );

    if (cityComponent) {
      return tr(cityComponent.long_name);
    }
  }
  return "";
};
