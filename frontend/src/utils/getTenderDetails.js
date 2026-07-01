export const parseTenders = (tenders) => {
  if (!tenders || !Array.isArray(tenders)) return [];

  return tenders
    .map((tender) => {
      const details = tender.details?.data?.route || {};
      const routeParts = details.routeparts || [];

      if (routeParts.length < 2) {
        console.warn(
          `Skipping tender ${tender.id} due to incomplete route data.`,
        );
        return null;
      }

      // periodic
      const periodic = details.periodic || "";
      const paymentType = details.paymenttype || {};
      const expirationDate = details.tenderavailableunillmoment || "";
      const quoteStep = details.step || 0;
      const currency = (details.defaultcurrency || "UAH").toUpperCase();

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

      const loadPart =
        routeParts.find((p) => p.workaction === 1) || routeParts[0] || {};
      const cargo =
        loadPart.cargo ||
        loadPart.cargoname ||
        details.cargo ||
        details.cargoname ||
        "";
      const loadType =
        loadPart.loadingtypeRelation?.title_ru ||
        loadPart.loadingtypeRelation?.title ||
        loadPart.loadingtype_relation?.title_ru ||
        loadPart.loadingtype_relation?.title ||
        "";
      const rawWeight =
        loadPart.weight ?? loadPart.cargoweight ?? details.totalweight ?? null;
      const weightNum =
        rawWeight != null ? parseFloat(rawWeight) || null : null;
      const weightStr =
        weightNum != null ? `${weightNum} т` : `${details.totalweight || 0} т`;

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
        weight: weightStr,
        cargo,
        loadType,
        tenderParent: details.tenderparent || "",
        kmprice: details.kmprice ? parseFloat(details.kmprice) : null,
        price,
        payor: payor.title_ru || "",
        terms: terms || "",
        paymentType,
        expirationDate,
        quoteStep,
        currency,
        response,
        amount,
        routeParts,
      };
    })
    .filter(Boolean); // Removes null values (incomplete tenders)
};
