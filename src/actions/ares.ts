"use server";

export async function fetchAresData(ico: string) {
  if (!ico) return null;

  try {
    const response = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("ARES API error");
    }

    const data = await response.json();
    
    // Parse address
    let address = "";
    if (data.sidlo) {
        const s = data.sidlo;
        address = `${s.nazevUlice || ""} ${s.cisloDomovni}`;
        if (s.cisloOrientacni) address += `/${s.cisloOrientacni}`;
        address = address.trim();
        if (!s.nazevUlice) {
            // If no street name, usually small village, use part of municipality
            address = `${s.nazevCastiObce || s.nazevObce} ${s.cisloDomovni}`;
        }
    }

    return {
      name: data.obchodniJmeno,
      address: address,
      city: data.sidlo?.nazevObce,
      zip: data.sidlo?.psc?.toString(),
      vatId: data.dic,
      taxId: data.ico
    };
  } catch (e) {
    console.error("ARES fetch failed", e);
    return null;
  }
}