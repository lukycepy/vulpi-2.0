export interface AresData {
  ico: string;
  dic?: string;
  name: string;
  address: {
    street?: string;
    city?: string;
    zip?: string;
    fullAddress: string;
  };
}

export async function fetchCompanyByIco(ico: string): Promise<AresData | null> {
  if (!ico || ico.length < 8) return null;

  try {
    const response = await fetch(
      `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Map ARES response to our structure
    // Note: ARES structure might vary, this is a simplified mapping based on common structure
    const address = data.sidlo;
    
    const street = address.nazevUlice || address.nazevCastiObce;
    const number = address.cisloDomovni + (address.cisloOrientacni ? "/" + address.cisloOrientacni : "");
    const fullStreet = street ? `${street} ${number}` : number;

    return {
      ico: data.ico,
      dic: data.dic,
      name: data.obchodniJmeno,
      address: {
        street: fullStreet,
        city: address.nazevObce,
        zip: address.psc,
        fullAddress: address.textovaAdresa || `${fullStreet}, ${address.psc} ${address.nazevObce}`,
      },
    };
  } catch (error) {
    console.error("ARES fetch error:", error);
    return null;
  }
}
