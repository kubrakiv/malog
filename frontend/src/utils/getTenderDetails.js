export const parseTenders = (tenders) => {
  if (!tenders || !Array.isArray(tenders)) return [];

  return tenders
    .map((tender) => {
      const details = tender.details?.data?.route || {};
      const routeParts = details.routeparts || [];

      if (routeParts.length < 2) {
        console.warn(
          `Skipping tender ${tender.id} due to incomplete route data.`
        );
        return null;
      }

      // periodic
      const periodic = details.periodic || "";
      const paymentType = details.paymenttype || {};
      const expirationDate = details.tenderavailableunillmoment || "";
      const quoteStep = details.step || 0;
      const currency = details.defaultcurrency || "UAH";

      // payor
      const payor = details.companydata || {};

      // Extracting tender terms
      const terms = details.tenderterms || "";

      const response = details.response || {};

      const amount = details.totalcount || 0;

      // const routeParts = details.routeparts || [];

      // Extracting origin & destination details
      const originCheckpoint = routeParts[0]?.checkpoint || {};
      const destinationCheckpoint =
        routeParts[routeParts.length - 1]?.checkpoint || {};

      const originTown = originCheckpoint.town || {};
      const destinationTown = destinationCheckpoint.town || {};

      const origin = {
        country:
          typeof originTown.country?.domainname === "string"
            ? originTown.country.domainname
            : "Unknown",
        city:
          typeof originTown.title_ru === "string"
            ? originTown.title_ru
            : "Unknown",
        postal:
          typeof originCheckpoint.zip === "string" ? originCheckpoint.zip : "",
      };

      const destination = {
        country:
          typeof destinationTown.country?.domainname === "string"
            ? destinationTown.country.domainname
            : "Unknown",
        city:
          typeof destinationTown.title_ru === "string"
            ? destinationTown.title_ru
            : "Unknown",
        postal:
          typeof destinationCheckpoint.zip === "string"
            ? destinationCheckpoint.zip
            : "",
      };

      // Extracting pickup and delivery times
      const pickup = `${routeParts[0]?.date1 || "N/A"} ${
        routeParts[0]?.time1 || "N/A"
      }`;
      const delivery = `${routeParts[routeParts.length - 1]?.date1 || "N/A"} ${
        routeParts[routeParts.length - 1]?.time1 || "N/A"
      }`;

      // Extracting additional pickup/delivery details
      const returnPickup = routeParts[1]?.date1 || pickup;
      const returnDelivery = routeParts[1]?.time1 || delivery;

      const price = details.budget || details.maxquotewithcommission || 0;

      // Extracting other relevant fields
      return {
        id: tender.id,
        periodic,
        origin,
        destination,
        pickup,
        delivery,
        returnPickup,
        returnDelivery,
        distance: details.distance || "N/A",
        type: details.cartype?.join(", ") || "N/A",
        weight: `${details.totalweight || 0} т`,
        price,
        payor: payor.title_ru || "",
        terms: terms || "",
        paymentType,
        expirationDate,
        quoteStep,
        currency: currency === null ? "UAH" : currency,
        response,
        amount,
        routeParts,
      };
    })
    .filter(Boolean); // Removes null values (incomplete tenders)
};
